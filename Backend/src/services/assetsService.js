const fs = require('fs').promises;
const { ASSETS_JS_PATH } = require('../config/constants');

class AssetsService {
    static async updateAssetsJS(itemData, imageFilename) {
        try {
            let content;
            
            try {
                content = await fs.readFile(ASSETS_JS_PATH, 'utf8');
            } catch (error) {
                if (error.code === 'ENOENT') {
                    const initialContent = `// Food imports will be added here automatically

export const food_list = [
    // Food items will be added here automatically
];

export const menu_list = [
    {
        menu_name: "Salad",
        menu_image: ""
    },
    {
        menu_name: "Rolls", 
        menu_image: ""
    },
    {
        menu_name: "Deserts",
        menu_image: ""
    },
    {
        menu_name: "Sandwich",
        menu_image: ""
    },
    {
        menu_name: "Cake",
        menu_image: ""
    },
    {
        menu_name: "Pure Veg",
        menu_image: ""
    },
    {
        menu_name: "Pasta",
        menu_image: ""
    },
    {
        menu_name: "Noodles",
        menu_image: ""
    }
];
`;
                    await fs.writeFile(ASSETS_JS_PATH, initialContent, 'utf8');
                    content = initialContent;
                } else {
                    throw error;
                }
            }

            const importVarName = `food_${itemData.id}`;
            const imageImport = `import ${importVarName} from "./${imageFilename}";\n`;
            
            if (!content.includes(importVarName)) {
                const importPattern = /(import.*?from.*?;[\n\r]*)*/;
                const match = content.match(importPattern);
                if (match) {
                    const insertPos = match[0].length;
                    content = content.substring(0, insertPos) + imageImport + content.substring(insertPos);
                } else {
                    content = imageImport + content;
                }
            }

            const newItem = `    {
        _id: "${itemData.id}",
        name: "${itemData.name}",
        image: ${importVarName},
        price: ${itemData.price},
        description: "${itemData.description}",
        category: "${itemData.category}"
    },`;

            if (content.includes("export const food_list = [")) {
                const foodListStart = content.indexOf("export const food_list = [") + "export const food_list = [".length;
                
                const remainingContent = content.substring(foodListStart);
                const lines = remainingContent.split('\n');
                let hasExistingContent = false;
                
                for (const line of lines) {
                    const stripped = line.trim();
                    if (stripped && !stripped.startsWith('//') && stripped !== ']') {
                        hasExistingContent = true;
                        break;
                    }
                }
                
                if (hasExistingContent) {
                    content = content.substring(0, foodListStart) + "\n" + newItem + content.substring(foodListStart);
                } else {
                    const closingBracketPos = content.indexOf("];", foodListStart);
                    if (closingBracketPos !== -1) {
                        content = content.substring(0, foodListStart) + "\n" + newItem + "\n" + content.substring(closingBracketPos);
                    }
                }
            } else {
                throw new Error("Could not find food_list export in assets.js");
            }

            await fs.writeFile(ASSETS_JS_PATH, content, 'utf8');
            return true;
        } catch (error) {
            console.error(`Error updating assets.js: ${error.message}`);
            return false;
        }
    }
}

module.exports = AssetsService;