const express = require("express");
const { getTopDistricts } = require("../controllers/home.controller");

const router = express.Router();

router.get("/top-districts", getTopDistricts);

module.exports = router;
