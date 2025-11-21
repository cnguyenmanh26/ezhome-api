const Booking = require("../models/booking.model");
const Room = require("../models/room.model");

const bookingController = {
  createBooking: async (req, res) => {
    try {
      const { roomId } = req.body;

      if (!roomId) {
        return res.status(400).json({ message: "roomId is required" });
      }

      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      const booking = new Booking({
        user: req.user._id,
        room: roomId,
        totalAmount: room.rentPrice,
        status: "pending",
      });

      await booking.save();
      await booking.populate("room");

      res.status(201).json({
        message: "Booking created successfully",
        booking,
      });
    } catch (error) {
      console.error("Create booking error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  getMyBookings: async (req, res) => {
    try {
      const bookings = await Booking.find({ user: req.user._id }).populate(
        "room"
      );

      res.json(bookings);
    } catch (error) {
      console.error("Get my bookings error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  getAllBookings: async (req, res) => {
    try {
      // Support pagination, filtering by status, and sorting (newest first by default)
      const page = Math.max(1, parseInt(req.query.page)) || 1;
      const limit = Math.max(1, parseInt(req.query.limit)) || 10;
      const status = req.query.status; // optional: pending, completed, cancelled
      // sort param: e.g. createdAt:desc or createdAt:asc or simply -createdAt
      let sort = { createdAt: -1 };
      if (req.query.sort) {
        const s = req.query.sort;
        // allow formats: -createdAt or createdAt:asc / createdAt:desc
        if (s.startsWith("-")) {
          sort = { [s.slice(1)]: -1 };
        } else if (s.includes(":")) {
          const [field, dir] = s.split(":");
          sort = { [field]: dir === "asc" ? 1 : -1 };
        } else {
          sort = { [s]: -1 };
        }
      }

      const filter = {};
      if (status) filter.status = status;

      const totalCount = await Booking.countDocuments(filter);
      const totalPages = Math.ceil(totalCount / limit) || 1;
      const skip = (page - 1) * limit;

      const bookings = await Booking.find(filter)
        .populate("user", "-password")
        .populate("room")
        .sort(sort)
        .skip(skip)
        .limit(limit);

      res.json({ bookings, page, totalPages, totalCount });
    } catch (error) {
      console.error("Get all bookings error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  updateBookingStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "status is required" });
      }

      if (!["pending", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({
          message: "status must be one of: pending, completed, cancelled",
        });
      }

      const booking = await Booking.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      )
        .populate("user", "-password")
        .populate("room");

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Tự động cập nhật room status khi booking completed
      if (status === "completed" && booking.room) {
        await Room.findByIdAndUpdate(booking.room._id, { status: "active" });
      }

      res.json({
        message: "Booking status updated successfully",
        booking,
      });
    } catch (error) {
      console.error("Update booking status error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = bookingController;
