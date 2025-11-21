const Room = require("../models/room.model");

const getTopDistricts = async (req, res, next) => {
  try {
    const topDistricts = await Room.aggregate([
      {
        $match: {
          "address.city": "Thành phố Hà Nội",
          "status": "inactive", // Chỉ hiển thị phòng còn trống
        },
      },
      {
        $group: {
          _id: "$address.district",
          roomCount: { $sum: 1 },
          rooms: {
            $push: {
              _id: "$_id",
              title: "$title",
              rentPrice: "$rentPrice",
              media: "$media",
            },
          },
        },
      },
      {
        $sort: {
          roomCount: -1,
        },
      },
      {
        $limit: 3,
      },
      {
        $project: {
          _id: 0,
          district: "$_id",
          roomCount: 1,
          rooms: "$rooms", // Hiển thị TẤT CẢ phòng (không giới hạn)
        },
      },
    ]);

    res.json({
      districts: topDistricts,
    });
  } catch (error) {
    console.error("Error in getTopDistricts:", error);
    next(error);
  }
};

module.exports = {
  getTopDistricts,
};

/*
Example response:
{
  "districts": [
    {
      "district": "Đống Đa",
      "roomCount": 42,
      "rooms": [
        {
          "_id": "652f0c1a2f1b9a3fdc7e1234",
          "title": "Phòng studio đầy đủ nội thất",
          "rentPrice": 4500000,
          "image": "https://cdn.ezhome.vn/rooms/abc123.jpg"
        },
        {
          "_id": "652f0c1a2f1b9a3fdc7e5678",
          "title": "Phòng rộng 25m2 gần trung tâm",
          "rentPrice": 5200000,
          "image": "https://cdn.ezhome.vn/rooms/xyz456.jpg"
        }
        // ...tất cả phòng trong district (không giới hạn)
      ]
    }
    // ...top 3 districts
  ]
}
*/

