const express = require('express');
const { login, register } = require('../controllers/authController');
const { validateLoginData, validateRegistrationData, validateUserRole } = require('../middleware/validation');

const router = express.Router();

router.post('/login', validateLoginData, login);
router.post('/register', validateRegistrationData, validateUserRole, register);

module.exports = router;