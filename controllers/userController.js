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
      const { name, phone, avatar } = req.body;
      const userId = req.user._id;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (avatar !== undefined) updateData.avatar = avatar;

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
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = userController;
