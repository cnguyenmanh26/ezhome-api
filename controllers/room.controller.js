const Room = require("../models/room.model");
const cloudinary = require("../config/cloudinary");

const roomController = {
  getAllRooms: async (req, res) => {
    try {
      // Ví dụ URL: GET /api/rooms?city=Hà Nội&district=Cầu Giấy&minPrice=2000000&maxPrice=4000000
      const { city, district, minPrice, maxPrice } = req.query;

      const filter = {};

      if (city) {
        filter["address.city"] = city;
      }

      if (district) {
        filter["address.district"] = district;
      }

      if (minPrice || maxPrice) {
        filter.rentPrice = {};
        if (minPrice) {
          filter.rentPrice.$gte = parseFloat(minPrice);
        }
        if (maxPrice) {
          filter.rentPrice.$lte = parseFloat(maxPrice);
        }
      }

      const rooms = await Room.find(filter).sort({ createdAt: -1 });
      res.json(rooms);
    } catch (error) {
      console.error("Get all rooms error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  getRoomById: async (req, res) => {
    try {
      const mongoose = require("mongoose");

      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid room ID format" });
      }

      const room = await Room.findById(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error) {
      console.error("Get room by id error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  createRoom: async (req, res) => {
    try {
      const {
        title,
        description,
        rentPrice,
        area,
        link360,
        city,
        district,
        street,
        furnitureDetails,
        electricityCost,
        waterCost,
        wifiCost,
        parkingCost,
        status,
      } = req.body;

      if (!title || !rentPrice || !area || !city || !district || !street) {
        return res.status(400).json({
          message:
            "Title, rentPrice, area, city, district, and street are required",
        });
      }

      const images = [];
      const videos = [];

      if (req.files?.images) {
        req.files.images.forEach((file) => {
          images.push({
            url: file.path,
            public_id: file.filename,
          });
        });
      }

      if (req.files?.videos) {
        req.files.videos.forEach((file) => {
          videos.push({
            url: file.path,
            public_id: file.filename,
          });
        });
      }

      const room = new Room({
        title,
        description,
        rentPrice: parseFloat(rentPrice),
        area: parseFloat(area),
        media: {
          images,
          videos,
          link360: link360 || "",
        },
        address: {
          city,
          district,
          street,
        },
        utilities: {
          furnitureDetails: furnitureDetails || "",
          electricityCost: parseFloat(electricityCost) || 0,
          waterCost: parseFloat(waterCost) || 0,
          wifiCost: parseFloat(wifiCost) || 0,
          parkingCost: parseFloat(parkingCost) || 0,
        },
        status: status || "inactive",
      });

      await room.save();

      res.status(201).json({
        message: "Room created successfully",
        room,
      });
    } catch (error) {
      console.error(
        `Error in ${req.method === "POST" ? "createRoom" : "updateRoom"}:`,
        error
      );

      // Xử lý lỗi validation của Mongoose (nếu một trường required bị thiếu)
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors).map((val) => val.message);
        return res.status(400).json({
          message: "Lỗi Validation Mongoose: " + messages.join(", "),
          errors: error.errors,
        });
      }

      // Xử lý lỗi Cloudinary (nếu file upload thất bại)
      if (error.message && error.message.includes("Upload failed")) {
        return res
          .status(500)
          .json({ message: "Lỗi Upload Cloudinary: " + error.message });
      }

      // Lỗi chung
      res.status(500).json({ message: "Lỗi Server không xác định" });
    }
  },

  updateRoom: async (req, res) => {
    try {
      // req.body may be undefined if content-type is multipart/form-data and
      // no upload middleware is applied. Normalize to an object to avoid
      // destructure errors.
      const body = req.body || {};
      const {
        title,
        description,
        rentPrice,
        area,
        link360,
        city,
        district,
        street,
        furnitureDetails,
        electricityCost,
        waterCost,
        wifiCost,
        parkingCost,
        status,
      } = body;

      const updateData = {};

      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (rentPrice) updateData.rentPrice = parseFloat(rentPrice);
      if (area) updateData.area = parseFloat(area);
      if (link360 !== undefined) {
        updateData["media.link360"] = link360;
      }
      if (city) updateData["address.city"] = city;
      if (district) updateData["address.district"] = district;
      if (street) updateData["address.street"] = street;
      if (furnitureDetails !== undefined)
        updateData["utilities.furnitureDetails"] = furnitureDetails;
      if (electricityCost !== undefined)
        updateData["utilities.electricityCost"] = parseFloat(electricityCost);
      if (waterCost !== undefined)
        updateData["utilities.waterCost"] = parseFloat(waterCost);
      if (wifiCost !== undefined)
        updateData["utilities.wifiCost"] = parseFloat(wifiCost);
      if (parkingCost !== undefined)
        updateData["utilities.parkingCost"] = parseFloat(parkingCost);
      if (status !== undefined)
        updateData.status = status;

      // If media files were uploaded, we need to append them to the room
      // because the PUT route accepts multipart/form-data and upload middleware
      // already populated `req.files` with { path, filename } entries.
      let room = await Room.findById(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      // Append new images/videos if present (do not overwrite existing unless desired)
      if (
        req.files?.images &&
        Array.isArray(req.files.images) &&
        req.files.images.length
      ) {
        const newImages = req.files.images.map((f) => ({
          url: f.path,
          public_id: f.filename,
        }));
        room.media = room.media || {};
        room.media.images = Array.isArray(room.media.images)
          ? room.media.images.concat(newImages)
          : newImages;
      }

      if (
        req.files?.videos &&
        Array.isArray(req.files.videos) &&
        req.files.videos.length
      ) {
        const newVideos = req.files.videos.map((f) => ({
          url: f.path,
          public_id: f.filename,
        }));
        room.media = room.media || {};
        room.media.videos = Array.isArray(room.media.videos)
          ? room.media.videos.concat(newVideos)
          : newVideos;
      }

      // Apply other scalar updates
      Object.keys(updateData).forEach((key) => {
        // support nested keys like 'media.link360' or 'address.city'
        if (key.includes(".")) {
          const parts = key.split(".");
          let target = room;
          for (let i = 0; i < parts.length - 1; i++) {
            target[parts[i]] = target[parts[i]] || {};
            target = target[parts[i]];
          }
          target[parts[parts.length - 1]] = updateData[key];
        } else {
          room[key] = updateData[key];
        }
      });

      await room.save();

      res.json({ message: "Room updated successfully", room });
    } catch (error) {
      console.error("Update room error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  deleteRoom: async (req, res) => {
    try {
      const room = await Room.findById(req.params.id);

      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }

      const deletePromises = [];

      if (room.media?.images && room.media.images.length > 0) {
        room.media.images.forEach((image) => {
          deletePromises.push(
            cloudinary.uploader.destroy(image.public_id, {
              resource_type: "image",
            })
          );
        });
      }

      if (room.media?.videos && room.media.videos.length > 0) {
        room.media.videos.forEach((video) => {
          deletePromises.push(
            cloudinary.uploader.destroy(video.public_id, {
              resource_type: "video",
            })
          );
        });
      }

      if (deletePromises.length > 0) {
        await Promise.all(deletePromises);
      }

      await Room.findByIdAndDelete(req.params.id);

      res.json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error("Delete room error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = roomController;
