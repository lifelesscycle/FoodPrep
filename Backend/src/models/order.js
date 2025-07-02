const { readJSONFile, writeJSONFile } = require('../config/database');
const { ORDERS_FILE } = require('../config/constants');

class Order {
    static async findAll() {
        return await readJSONFile(ORDERS_FILE);
    }

    static async findById(orderId) {
        const orders = await this.findAll();
        return orders.find(o => o.orderId === orderId);
    }

    static async findByUserEmail(userEmail) {
        const orders = await this.findAll();
        return orders.filter(o => o.userEmail === userEmail);
    }

    static async findByStatus(status) {
        const orders = await this.findAll();
        return orders.filter(o => o.status === status);
    }

    static async findByUserEmailAfterDate(userEmail, afterDate) {
        const orders = await this.findByUserEmail(userEmail);
        return orders.filter(order => new Date(order.orderDate) > afterDate);
    }

    static async getLatestByUserEmail(userEmail) {
        const orders = await this.findByUserEmail(userEmail);
        if (orders.length === 0) return null;
        
        return orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))[0];
    }

    static async create(orderData) {
        const orders = await this.findAll();
        
        orderData.statusHistory = [
            {
                status: orderData.status,
                timestamp: new Date().toISOString(),
                description: "Order placed and confirmed"
            }
        ];
        orderData.lastUpdated = new Date().toISOString();
        
        orders.push(orderData);
        await writeJSONFile(ORDERS_FILE, orders);
        return orderData;
    }

    static async updateStatus(orderId, status, description) {
        const orders = await this.findAll();
        const orderIndex = orders.findIndex(o => o.orderId === orderId);
        
        if (orderIndex === -1) {
            throw new Error("Order not found");
        }
        
        const newStatusEntry = {
            status,
            timestamp: new Date().toISOString(),
            description: description || "Status updated"
        };
        
        orders[orderIndex].status = status;
        orders[orderIndex].lastUpdated = new Date().toISOString();
        if (!orders[orderIndex].statusHistory) {
            orders[orderIndex].statusHistory = [];
        }
        orders[orderIndex].statusHistory.push(newStatusEntry);
        
        await writeJSONFile(ORDERS_FILE, orders);
        return orders[orderIndex];
    }

    static async getAnalytics() {
        const orders = await this.findAll();
        
        const statusBreakdown = orders.reduce((acc, order) => {
            const status = order.status;
            if (!acc[status]) {
                acc[status] = { _id: status, count: 0, total_amount: 0 };
            }
            acc[status].count++;
            acc[status].total_amount += order.total || 0;
            return acc;
        }, {});
        
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(order => 
            order.orderDate && order.orderDate.startsWith(today)
        ).length;
        
        return {
            total_orders: orders.length,
            today_orders: todayOrders,
            status_breakdown: Object.values(statusBreakdown)
        };
    }

    static serializeOrder(order) {
        if (order.orderDate && typeof order.orderDate === 'object') {
            order.orderDate = order.orderDate.toISOString();
        }
        if (order.lastUpdated && typeof order.lastUpdated === 'object') {
            order.lastUpdated = order.lastUpdated.toISOString();
        }
        return order;
    }
}

module.exports = Order;
