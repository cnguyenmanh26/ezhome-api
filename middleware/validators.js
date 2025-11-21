const { body, validationResult } = require("express-validator");
const User = require("../models/User");

const registerRules = [
  body("email")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail()
    .custom(async (email) => {
      const user = await User.findOne({ email });
      if (user) {
        throw new Error("Email đã tồn tại");
      }
      return true;
    }),
  body("phone")
    .optional({ checkFalsy: true })
    .isMobilePhone("vi-VN")
    .withMessage("Số điện thoại không hợp lệ")
    .custom(async (phone) => {
      if (phone) {
        const user = await User.findOne({ phone });
        if (user) {
          throw new Error("Số điện thoại đã tồn tại");
        }
      }
      return true;
    }),
  body("password")
    .notEmpty()
    .withMessage("Mật khẩu không được để trống")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Tên không hợp lệ"),
];

module.exports = { registerRules, validationResult };

