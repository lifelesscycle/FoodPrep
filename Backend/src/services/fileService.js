const fs = require('fs').promises;
const path = require('path');
const { IMAGES_DIR } = require('../config/constants');

class FileService {
    static async deleteImageFile(filename) {
        if (!filename) return true;
        
        try {
            const imagePath = path.join(IMAGES_DIR, filename);
            await fs.unlink(imagePath);
            return true;
        } catch (error) {
            console.log(`Warning: Failed to delete image file: ${error.message}`);
            return false;
        }
    }

    static async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    static async createDirectory(dirPath) {
        try {
            await fs.mkdir(dirPath, { recursive: true });
            return true;
        } catch (error) {
            console.error(`Failed to create directory ${dirPath}: ${error.message}`);
            return false;
        }
    }

    static getFileExtension(filename) {
        return path.extname(filename);
    }

    static generateImageFilename(id, originalFilename) {
        const ext = this.getFileExtension(originalFilename);
        return `food_${id}${ext}`;
    }
}

module.exports = FileService;