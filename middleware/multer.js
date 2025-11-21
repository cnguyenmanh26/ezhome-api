const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    
    if (isImage || isVideo) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh hoặc video"), false);
    }
  },
});

const uploadRoomMedia = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "videos", maxCount: 2 },
]);

const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.files || (!req.files.images && !req.files.videos)) {
      return next();
    }

    const uploadPromises = [];

    if (req.files.images) {
      req.files.images.forEach((file) => {
        const uploadPromise = new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "ezhome/rooms",
              resource_type: "image",
              allowed_formats: ["jpg", "jpeg", "png", "webp"],
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve({
                  url: result.secure_url,
                  public_id: result.public_id,
                });
              }
            }
          );

          const bufferStream = new Readable();
          bufferStream.push(file.buffer);
          bufferStream.push(null);
          bufferStream.pipe(stream);
        });

        uploadPromises.push(uploadPromise);
      });
    }

    if (req.files.videos) {
      req.files.videos.forEach((file) => {
        const uploadPromise = new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "ezhome/rooms",
              resource_type: "video",
              allowed_formats: ["mp4", "mov", "avi", "webm"],
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve({
                  url: result.secure_url,
                  public_id: result.public_id,
                });
              }
            }
          );

          const bufferStream = new Readable();
          bufferStream.push(file.buffer);
          bufferStream.push(null);
          bufferStream.pipe(stream);
        });

        uploadPromises.push(uploadPromise);
      });
    }

    const results = await Promise.all(uploadPromises);

    let resultIndex = 0;

    if (req.files.images) {
      req.files.images = req.files.images.map(() => {
        const result = results[resultIndex];
        resultIndex++;
        return {
          path: result.url,
          filename: result.public_id,
        };
      });
    }

    if (req.files.videos) {
      req.files.videos = req.files.videos.map(() => {
        const result = results[resultIndex];
        resultIndex++;
        return {
          path: result.url,
          filename: result.public_id,
        };
      });
    }

    next();
  } catch (error) {
    console.error("Upload to Cloudinary error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

module.exports = { uploadRoomMedia, uploadToCloudinary };

