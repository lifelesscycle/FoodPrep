const express = require('express');
const {
    placeOrder,
    trackOrder,
    updateOrderStatus,
    getOrderStatus,
    getOrdersByStatus,
    getUserOrders,
    getLatestOrder
} = require('../controllers/orderController');
const { validateOrderStatus } = require('../middleware/validation');

const router = express.Router();

router.post('/place', placeOrder);

router.get('/track/:order_id', trackOrder);
router.get('/status/:order_id', getOrderStatus);

router.post('/update-status', validateOrderStatus, updateOrderStatus);
router.get('/by-status', getOrdersByStatus);

router.get('/user', getUserOrders);
router.get('/user/latest', getLatestOrder);

module.exports = router;