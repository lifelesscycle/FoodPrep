const express = require('express');
const authRoutes = require('./auth');
const foodRoutes = require('./food');
const orderRoutes = require('./orders');
const analyticsRoutes = require('./analytics');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/food', foodRoutes);
router.use('/orders', orderRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;