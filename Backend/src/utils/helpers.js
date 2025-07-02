const { v4: uuidv4 } = require('uuid');

function generateId() {
    return uuidv4().replace(/-/g, '').substring(0, 12);
}

function sanitizeString(str) {
    return str ? str.trim() : '';
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePrice(price) {
    const numPrice = parseFloat(price);
    return !isNaN(numPrice) && numPrice > 0;
}

function formatDate(date) {
    return new Date(date).toISOString();
}

function isValidDate(dateString) {
    try {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    } catch {
        return false;
    }
}

function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    generateId,
    sanitizeString,
    validateEmail,
    validatePrice,
    formatDate,
    isValidDate,
    asyncHandler
};