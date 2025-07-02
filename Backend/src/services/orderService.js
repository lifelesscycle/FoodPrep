const Order = require('./../models/order');
const User = require('./../models/user');
const { STATUS_DESCRIPTIONS } = require('../config/constants');

class OrderService {
    static async createOrder(orderData) {
        const user = await User.findByEmail(orderData.userEmail);
        if (!user) {
            throw new Error("User not found. Please register first.");
        }

        return await Order.create(orderData);
    }

    static async updateOrderStatus(orderId, status, updatedAt) {
        const description = STATUS_DESCRIPTIONS[status] || "Status updated";
        return await Order.updateStatus(orderId, status, description);
    }

    static async getOrdersByStatus(status) {
        const orders = await Order.findByStatus(status);
        return orders
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .map(Order.serializeOrder);
    }

    static async getUserOrders(userEmail, afterDate = null) {
        let orders;
        
        if (afterDate) {
            const afterDateObj = new Date(afterDate);
            if (isNaN(afterDateObj)) {
                throw new Error("Invalid 'after' timestamp format. Use ISO format.");
            }
            orders = await Order.findByUserEmailAfterDate(userEmail, afterDateObj);
        } else {
            orders = await Order.findByUserEmail(userEmail);
        }

        return orders
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .map(Order.serializeOrder);
    }

    static async getLatestUserOrder(userEmail) {
        const order = await Order.getLatestByUserEmail(userEmail);
        if (!order) {
            throw new Error("No orders found for this user");
        }
        return Order.serializeOrder(order);
    }

    static async getOrderAnalytics() {
        return await Order.getAnalytics();
    }

    static async trackOrder(orderId) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error("Order not found");
        }
        return Order.serializeOrder(order);
    }

    static async getOrderStatus(orderId) {
        const order = await Order.findById(orderId);
        if (!order) {
            throw new Error("Order not found");
        }

        const orderStatus = {
            orderId: order.orderId,
            status: order.status,
            statusHistory: order.statusHistory,
            lastUpdated: order.lastUpdated
        };

        return Order.serializeOrder(orderStatus);
    }
}

module.exports = OrderService;