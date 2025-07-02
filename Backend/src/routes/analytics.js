const express = require('express');
const { getOrderAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/orders', getOrderAnalytics);

module.exports = router;