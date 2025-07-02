const { VALID_ORDER_STATUSES, VALID_USER_ROLES } = require('../config/constants');

const validateFoodItem = (req, res, next) => {
    const { name, price, description } = req.body;
    const file = req.file;
    
    if (!name || !name.trim()) {
        return res.status(400).json({ detail: "Name cannot be empty" });
    }
    if (!price || parseFloat(price) <= 0) {
        return res.status(400).json({ detail: "Price must be greater than 0" });
    }
    if (!description || !description.trim()) {
        return res.status(400).json({ detail: "Description cannot be empty" });
    }
    if (!file) {
        return res.status(400).json({ detail: "No image file provided" });
    }
    
    next();
};

const validateOrderStatus = (req, res, next) => {
    const { status } = req.body;
    
    if (!VALID_ORDER_STATUSES.includes(status)) {
        return res.status(400).json({
            detail: `Invalid status. Valid statuses are: ${VALID_ORDER_STATUSES.join(', ')}`
        });
    }
    
    next();
};

const validateUserRole = (req, res, next) => {
    const { role = "user" } = req.body;
    
    if (!VALID_USER_ROLES.includes(role)) {
        req.body.role = "user";
    }
    
    next();
};

const validateLoginData = (req, res, next) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ detail: "Email and password are required" });
    }
    
    next();
};

const validateRegistrationData = (req, res, next) => {
    const { userid, password, email } = req.body;
    
    if (!userid || !password || !email) {
        return res.status(400).json({ detail: "User ID, password, and email are required" });
    }
    
    next();
};

module.exports = {
    validateFoodItem,
    validateOrderStatus,
    validateUserRole,
    validateLoginData,
    validateRegistrationData
};