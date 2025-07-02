const multer = require('multer');
const path = require('path');
const { IMAGES_DIR, ALLOWED_IMAGE_TYPES } = require('./constants');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, IMAGES_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `food_${req.body.id}${ext}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid image type. Only JPEG, PNG, and WEBP are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});

module.exports = upload;