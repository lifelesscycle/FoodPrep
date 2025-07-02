const path = require('path');

module.exports = {
    DATA_DIR: './data',
    USERS_FILE: path.join('./data', 'users.json'),
    ORDERS_FILE: path.join('./data', 'orders.json'),
    FOOD_ITEMS_FILE: path.join('./data', 'food_items.json'),
    ASSETS_JS_PATH: './../src/assets/assets/assets.js',
    IMAGES_DIR: './../src/assets/assets',
    
    VALID_ORDER_STATUSES: ["confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
    
    VALID_USER_ROLES: ["user", "manager", "owner"],
    
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    
    STATUS_DESCRIPTIONS: {
        "confirmed": "Order confirmed and being processed",
        "preparing": "Your order is being prepared",
        "out_for_delivery": "Order is out for delivery",
        "delivered": "Order has been delivered successfully",
        "cancelled": "Order has been cancelled"
    }
};