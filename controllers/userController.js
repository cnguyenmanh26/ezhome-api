const User = require("../models/User");

const userController = {
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json(users);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  getUserById: async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // User chỉ có thể xem chính mình hoặc admin có thể xem tất cả
      if (req.user.role !== "admin" && req.user._id.toString() !== req.params.id) {
        return res.status(403).json({
          message: "Forbidden: You can only view your own profile",
        });
      }

      res.json(user);
    } catch (error) {
      console.error("Get user by id error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  createUser: async (req, res) => {
    try {
      const newUser = new User(req.body);
      await newUser.save();
      const userResponse = newUser.toObject();
      delete userResponse.password;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  updateUser: async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  updateOwnProfile: async (req, res) => {
    try {
      const { name, phone, email, address } = req.body;
      let { avatar } = req.body;
      const userId = req.user._id;

      // Nếu có file upload lên (qua middleware upload Cloudinary), dùng path của file làm avatar
      if (req.file) {
        avatar = req.file.path;
      }

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (avatar !== undefined) updateData.avatar = avatar;
      if (address !== undefined) updateData.address = address;

      // Nếu cập nhật email, cần kiểm tra xem email đã tồn tại chưa (trừ chính user này)
      if (email !== undefined) {
        const existingUser = await User.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
          return res.status(400).json({ message: "Email already in use" });
        }
        updateData.email = email;
      }

      const user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        message: "Profile updated successfully",
        user,
      });
    } catch (error) {
      console.error("Update own profile error:", error);
      if (error.code === 11000) {
        // Handle duplicate key error (e.g., phone number already exists)
        if (error.keyPattern.phone) {
          return res.status(400).json({ message: "Phone number already in use" });
        }
        if (error.keyPattern.email) {
          return res.status(400).json({ message: "Email already in use" });
        }
      }
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = userController;
