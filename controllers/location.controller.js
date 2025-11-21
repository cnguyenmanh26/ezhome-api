const axios = require("axios");

const FALLBACK = "https://provinces.open-api.vn/api";
const BASE = "https://open.oapi.vn";

const locationController = {
  getProvinces: async (req, res) => {
    try {
      // try fallback first
      const urls = [
        `${FALLBACK}/?depth=2`,
        `${FALLBACK}/`,
        `${BASE}/api/?depth=2`,
      ];
      for (const url of urls) {
        try {
          const resp = await axios.get(url, { timeout: 8000 });
          if (resp && resp.data) return res.json(resp.data);
        } catch (err) {
          // try next
        }
      }
      return res.json([]);
    } catch (err) {
      console.error("Location getProvinces error:", err?.message || err);
      res.status(500).json({ message: "Failed to fetch provinces" });
    }
  },

  getDistricts: async (req, res) => {
    const { code } = req.params;
    if (!code)
      return res.status(400).json({ message: "Missing province code" });
    try {
      const tries = [
        `${FALLBACK}/p/${encodeURIComponent(code)}?depth=2`,
        `${BASE}/api/p/${encodeURIComponent(code)}?depth=2`,
        `${FALLBACK}/p/${encodeURIComponent(code)}`,
      ];
      for (const url of tries) {
        try {
          const resp = await axios.get(url, { timeout: 8000 });
          if (resp && resp.data) return res.json(resp.data);
        } catch (err) {
          // continue
        }
      }
      return res.json([]);
    } catch (err) {
      console.error("Location getDistricts error:", err?.message || err);
      res.status(500).json({ message: "Failed to fetch districts" });
    }
  },
};

module.exports = locationController;
