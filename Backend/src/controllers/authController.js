const User = require('../models/user');
const bcrypt = require('bcrypt');
const { asyncHandler } = require('../utils/helpers');

const SALT_ROUNDS = 12;

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    const user = await User.findByEmail(email);
    
    if (!user) {
        return res.status(401).json({ detail: "Invalid email or password" });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (isPasswordValid) {
        res.json({
            status: "success",
            message: "User authenticated",
            user: {
                userid: user.userid,
                email: user.email,
                name: user.name || user.userid.charAt(0).toUpperCase() + user.userid.slice(1),
                role: user.role || "user"
            }
        });
    } else {
        res.status(401).json({ detail: "Invalid email or password" });
    }
});

const register = asyncHandler(async (req, res) => {
    const { userid, password, email, role = "user" } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        const newUser = {
            userid,
            password: hashedPassword, 
            email,
            role
        };
        
        await User.create(newUser);
        
        res.json({
            status: "success",
            message: `User registered successfully as ${role}`
        });
    } catch (error) {
        if (error.message.includes("already exists")) {
            return res.status(409).json({ detail: error.message });
        }
        throw error;
    }
});

module.exports = {
    login,
    register
};