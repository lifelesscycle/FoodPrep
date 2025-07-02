const { readJSONFile, writeJSONFile } = require('../config/database');
const { USERS_FILE } = require('../config/constants');

class User {
    static async findAll() {
        return await readJSONFile(USERS_FILE);
    }

    static async findByEmail(email) {
        const users = await this.findAll();
        return users.find(u => u.email === email);
    }

    static async findByUserId(userid) {
        const users = await this.findAll();
        return users.find(u => u.userid === userid);
    }

    static async findByCredentials(email, password) {
        const users = await this.findAll();
        return users.find(u => u.email === email && u.password === password);
    }

    static async create(userData) {
        const users = await this.findAll();
        
        if (users.find(u => u.userid === userData.userid)) {
            throw new Error("User ID already exists");
        }
        
        if (users.find(u => u.email === userData.email)) {
            throw new Error("Email already exists");
        }
        
        users.push(userData);
        await writeJSONFile(USERS_FILE, users);
        return userData;
    }

    static async update(userid, updateData) {
        const users = await this.findAll();
        const userIndex = users.findIndex(u => u.userid === userid);
        
        if (userIndex === -1) {
            throw new Error("User not found");
        }
        
        users[userIndex] = { ...users[userIndex], ...updateData };
        await writeJSONFile(USERS_FILE, users);
        return users[userIndex];
    }

    static async delete(userid) {
        const users = await this.findAll();
        const userIndex = users.findIndex(u => u.userid === userid);
        
        if (userIndex === -1) {
            throw new Error("User not found");
        }
        
        const deletedUser = users.splice(userIndex, 1)[0];
        await writeJSONFile(USERS_FILE, users);
        return deletedUser;
    }
}

module.exports = User;
