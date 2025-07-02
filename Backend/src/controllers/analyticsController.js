const OrderService = require('../services/orderService');
const { asyncHandler } = require('../utils/helpers');

const getOrderAnalytics = asyncHandler(async (req, res) => {
    const analytics = await OrderService.getOrderAnalytics();
    res.json(analytics);
});

module.exports = {
    getOrderAnalytics
};