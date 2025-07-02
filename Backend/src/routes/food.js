const express = require('express');
const upload = require('../config/multer');
const {
    addFoodItem,
    getFoodItems,
    deleteFoodItem,
    updateFoodItem,
    getFoodItemsByCategory
} = require('../controllers/foodController');
const { validateFoodItem } = require('../middleware/validation');

const router = express.Router();

router.post('/add', upload.single('image'), validateFoodItem, addFoodItem);
router.get('/', getFoodItems);
router.get('/category/:category', getFoodItemsByCategory);
router.put('/:item_id', upload.single('image'), updateFoodItem);
router.delete('/:item_id', deleteFoodItem);

module.exports = router;