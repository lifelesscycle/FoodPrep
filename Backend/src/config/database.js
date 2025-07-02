const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const { DATA_DIR, USERS_FILE, ORDERS_FILE, FOOD_ITEMS_FILE, IMAGES_DIR } = require('./constants');

const SALT_ROUNDS = 12;

async function ensureDataDirectory() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

async function readJSONFile(filePath, defaultValue = []) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            await writeJSONFile(filePath, defaultValue);
            return defaultValue;
        }
        throw error;
    }
}

async function writeJSONFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function initializeDatabase() {
    await ensureDataDirectory();
    
    const users = await readJSONFile(USERS_FILE, []);
    if (users.length === 0) {
        console.log("Creating default users with hashed passwords...");
        
        const [adminHash, managerHash, testUserHash] = await Promise.all([
            hashPassword("admin"),
            hashPassword("manager"),
            hashPassword("password123")
        ]);
        
        const defaultUsers = [
            {
                userid: "admin",
                email: "admin@prep.com",
                password: adminHash,
                role: "owner"
            },
            {
                userid: "manager",
                email: "manager@prep.com",
                password: managerHash,
                role: "manager"
            },
            {
                userid: "testuser",
                email: "test@example.com",
                password: testUserHash,
                role: "user"
            }
        ];
        
        await writeJSONFile(USERS_FILE, defaultUsers);
        console.log("Default users created with hashed passwords.");
    } else {
        console.log("Users already exist in database.");
    }
    
    await readJSONFile(ORDERS_FILE, []);
    await readJSONFile(FOOD_ITEMS_FILE, []);
    
    try {
        await fs.access(IMAGES_DIR);
    } catch {
        await fs.mkdir(IMAGES_DIR, { recursive: true });
    }
    
    console.log("Database initialized.");
}

module.exports = {
    ensureDataDirectory,
    readJSONFile,
    writeJSONFile,
    initializeDatabase,
    hashPassword
};