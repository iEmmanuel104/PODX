import multer from "multer";

/**
 * Middleware for handling file uploads using multer
 * Configures multer to store files in memory and set file size limits
 * Also filters files to accept only image types
 */

const IMAGE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB limit
// const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/gif"];

export const UploadImageFiles = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: IMAGE_SIZE_LIMIT,
    },
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed"));
        }
    },
});
