const FoodItem = require('../models/FoodItem');
const AssetsService = require('../services/assetsService');
const FileService = require('../services/fileService');
const cloudinary = require('cloudinary').v2;
const { generateId, asyncHandler } = require('../utils/helpers');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const addFoodItem = asyncHandler(async (req, res) => {
    const { id, name, price, description, category } = req.body;
    const file = req.file;
    
    try {
        const cloudinaryResult = await cloudinary.uploader.upload(file.path, {
            folder: 'FoodAssets', 
            resource_type: 'image'
        });
        
        const itemData = {
            id: id || generateId(),
            name: name.trim(),
            price: parseFloat(price),
            description: description.trim(),
            category,
            image: cloudinaryResult.secure_url 
        };
        
        await FoodItem.create(itemData);
        
        res.json({
            success: true,
            message: `Item '${name}' added successfully`,
            item_id: itemData.id,
            image_url: cloudinaryResult.secure_url
        });
        
    } catch (error) {
        console.error('Error adding food item:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add food item',
            error: error.message
        });
    }
});

const getFoodItems = asyncHandler(async (req, res) => {
    const items = await FoodItem.findAll();
    res.json({ success: true, items });
});

const deleteFoodItem = asyncHandler(async (req, res) => {
    const { item_id } = req.params;
    
    const item = await FoodItem.findById(item_id);
    if (!item) {
        return res.status(404).json({ detail: "Food item not found" });
    }
    
    await FoodItem.delete(item_id);
    
    if (item.image_filename) {
        await FileService.deleteImageFile(item.image_filename);
    }
    
    res.json({ success: true, message: "Item deleted successfully" });
});

const updateFoodItem = asyncHandler(async (req, res) => {
    const { item_id } = req.params;
    const updateData = req.body;
    
    const item = await FoodItem.findById(item_id);
    if (!item) {
        return res.status(404).json({ detail: "Food item not found" });
    }
    
    if (req.file) {
        if (item.image_filename) {
            await FileService.deleteImageFile(item.image_filename);
        }
        updateData.image_filename = req.file.filename;
    }
    
    if (updateData.price) {
        updateData.price = parseFloat(updateData.price);
    }
    
    const updatedItem = await FoodItem.update(item_id, updateData);
    
    res.json({
        success: true,
        message: "Item updated successfully",
        item: updatedItem
    });
});

const getFoodItemsByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    const items = await FoodItem.findByCategory(category);
    res.json({ success: true, items });
});

module.exports = {
    addFoodItem,
    getFoodItems,
    deleteFoodItem,
    updateFoodItem,
    getFoodItemsByCategory
};