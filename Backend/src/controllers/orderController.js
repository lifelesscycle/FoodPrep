const OrderService = require('../services/orderService');
const { asyncHandler } = require('../utils/helpers');

const placeOrder = asyncHandler(async (req, res) => {
    const orderData = req.body;
    
    const order = await OrderService.createOrder(orderData);
    res.json({ success: true, orderId: order.orderId });
});

const trackOrder = asyncHandler(async (req, res) => {
    const { order_id } = req.params;
    
    const order = await OrderService.trackOrder(order_id);
    res.json(order);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId, status, updatedAt } = req.body;
    
    const order = await OrderService.updateOrderStatus(orderId, status, updatedAt);
    
    res.json({
        success: true,
        message: `Order status updated to ${status}`,
        order
    });
});

const getOrderStatus = asyncHandler(async (req, res) => {
    const { order_id } = req.params;
    
    const orderStatus = await OrderService.getOrderStatus(order_id);
    res.json(orderStatus);
});

const getOrdersByStatus = asyncHandler(async (req, res) => {
    const { status } = req.query;
    
    const orders = await OrderService.getOrdersByStatus(status);
    res.json(orders);
});

const getUserOrders = asyncHandler(async (req, res) => {
    const { userEmail, after } = req.query;
    
    const orders = await OrderService.getUserOrders(userEmail, after);
    res.json(orders);
});

const getLatestOrder = asyncHandler(async (req, res) => {
    const { userEmail } = req.query;
    
    const order = await OrderService.getLatestUserOrder(userEmail);
    res.json(order);
});

module.exports = {
    placeOrder,
    trackOrder,
    updateOrderStatus,
    getOrderStatus,
    getOrdersByStatus,
    getUserOrders,
    getLatestOrder
};