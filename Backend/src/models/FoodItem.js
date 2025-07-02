const { readJSONFile, writeJSONFile } = require('../config/database');
const { FOOD_ITEMS_FILE } = require('../config/constants');

class FoodItem {
    static async findAll() {
        return await readJSONFile(FOOD_ITEMS_FILE);
    }

    static async findById(id) {
        const items = await this.findAll();
        return items.find(item => item.id === id);
    }

    static async findByCategory(category) {
        const items = await this.findAll();
        return items.filter(item => item.category === category);
    }

    static async create(itemData) {
        const items = await this.findAll();
        
        itemData.created_at = new Date().toISOString();
        
        items.push(itemData);
        await writeJSONFile(FOOD_ITEMS_FILE, items);
        return itemData;
    }

    static async update(id, updateData) {
        const items = await this.findAll();
        const itemIndex = items.findIndex(item => item.id === id);
        
        if (itemIndex === -1) {
            throw new Error("Food item not found");
        }
        
        items[itemIndex] = { ...items[itemIndex], ...updateData };
        await writeJSONFile(FOOD_ITEMS_FILE, items);
        return items[itemIndex];
    }

    static async delete(id) {
        const items = await this.findAll();
        const itemIndex = items.findIndex(item => item.id === id);
        
        if (itemIndex === -1) {
            throw new Error("Food item not found");
        }
        
        const deletedItem = items.splice(itemIndex, 1)[0];
        await writeJSONFile(FOOD_ITEMS_FILE, items);
        return deletedItem;
    }
}

module.exports = FoodItem;