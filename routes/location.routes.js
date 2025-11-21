const express = require("express");
const router = express.Router();
const locationController = require("../controllers/location.controller");

// GET /api/locations/provinces
router.get("/provinces", locationController.getProvinces);

// GET /api/locations/districts/:code
router.get("/districts/:code", locationController.getDistricts);
module.exports = router;
