from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import shutil
import os
import json
import re

app = FastAPI()

# Enable CORS (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "foodprep"
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[DB_NAME]
user_collection = db["user_data"]
order_collection = db["orders"]
food_collection = db["food_items"]  # New collection for food items

# File paths - adjust these according to your project structure
ASSETS_JS_PATH = "./../src/assets/assets/assets.js"
IMAGES_DIR = "./../src/assets/assets"

# ==============================
# Models
# ==============================

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    userid: str
    password: str
    email: EmailStr
    role: Optional[str] = "user"

class OrderItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    category: Optional[str] = None
    image: Optional[str] = None

class Address(BaseModel):
    street: str
    city: str
    state: str
    zipCode: str
    country: str

class PlaceOrderRequest(BaseModel):
    orderId: str
    userId: str
    userName: str
    userEmail: EmailStr
    items: List[OrderItem]
    address: Address
    subtotal: float
    discount: float
    total: float
    appliedCoupon: Optional[str]
    paymentMethod: str
    orderDate: str
    status: str

class UpdateOrderStatusRequest(BaseModel):
    orderId: str
    status: str
    updatedAt: Optional[str] = None

class FoodItem(BaseModel):
    name: str
    price: float
    description: str
    category: str

# ==============================
# DB Initializer
# ==============================

def initialize_db():
    if user_collection.count_documents({}) == 0:
        default_users = [
            {
                "userid": "admin",
                "email": "admin@prep.com",
                "password": "admin",
                "role": "owner"
            },
            {
                "userid": "testuser",
                "email": "test@example.com",
                "password": "password123",
                "role": "user"
            }
        ]
        user_collection.insert_many(default_users)
        print("✅ Default users created.")
    else:
        print("ℹ️ Users already exist in database.")

@app.on_event("startup")
def startup_db():
    try:
        client.server_info()
        initialize_db()
        # Ensure images directory exists
        os.makedirs(IMAGES_DIR, exist_ok=True)
        print("✅ Database connected and initialized.")
    except ServerSelectionTimeoutError:
        print("❌ Could not connect to MongoDB.")

# ==============================
# Auth Routes
# ==============================

@app.post("/login")
def login_user(request: LoginRequest):
    user = user_collection.find_one({"email": request.email, "password": request.password})
    if user:
        return {
            "status": "success",
            "message": "User authenticated",
            "user": {
                "userid": user["userid"],
                "email": user["email"],
                "name": user.get("name", user["userid"].title()),
                "role": user.get("role", "user")
            }
        }
    raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/register")
def register_user(request: RegisterRequest):
    if user_collection.find_one({"userid": request.userid}):
        raise HTTPException(status_code=409, detail="User ID already exists")
    if user_collection.find_one({"email": request.email}):
        raise HTTPException(status_code=409, detail="Email already exists")

    valid_roles = ["user", "manager", "owner"]
    role = request.role if request.role in valid_roles else "user"

    user_collection.insert_one({
        "userid": request.userid,
        "password": request.password,
        "email": request.email,
        "role": role
    })
    return {"status": "success", "message": f"User registered successfully as {role}"}

# ==============================
# Food Item Management
# ==============================

def update_assets_js(item_data, image_filename):
    """Update the assets.js file with new food item"""
    try:
        # Check if assets.js exists
        if not os.path.exists(ASSETS_JS_PATH):
            # Create a basic assets.js file
            initial_content = '''// Food imports will be added here automatically

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
'''
            with open(ASSETS_JS_PATH, "w", encoding="utf-8") as f:
                f.write(initial_content)

        with open(ASSETS_JS_PATH, "r", encoding="utf-8") as f:
            content = f.read()

        # Create import statement
        import_var_name = f"food_{item_data['id']}"
        image_import = f'import {import_var_name} from "./{image_filename}";\n'
        
        # Add import at the top if not already there
        if import_var_name not in content:
            # Find where to insert the import (after existing imports or at the beginning)
            import_pattern = r'(import.*?from.*?;[\n\r]*)*'
            match = re.search(import_pattern, content)
            if match:
                insert_pos = match.end()
            else:
                insert_pos = 0
            content = content[:insert_pos] + image_import + content[insert_pos:]

        # Create food item object
        new_item = f'''    {{
        _id: "{item_data['id']}",
        name: "{item_data['name']}",
        image: {import_var_name},
        price: {item_data['price']},
        description: "{item_data['description']}",
        category: "{item_data['category']}"
    }},'''

        # Find the food_list array and add the new item
        if "export const food_list = [" in content:
            # Find the position right after the opening bracket
            food_list_start = content.find("export const food_list = [") + len("export const food_list = [")
            
            # Look for the first non-comment, non-whitespace content after the bracket
            # If there's already content, add comma and newline before our item
            remaining_content = content[food_list_start:]
            first_non_empty_line = ""
            for line in remaining_content.split('\n'):
                stripped = line.strip()
                if stripped and not stripped.startswith('//') and stripped != ']':
                    first_non_empty_line = stripped
                    break
            
            if first_non_empty_line:
                # There's existing content, add our item at the beginning with proper formatting
                content = content[:food_list_start] + "\n" + new_item + content[food_list_start:]
            else:
                # Empty array, add our item
                insert_pos = food_list_start
                # Find the closing bracket
                closing_bracket_pos = content.find("];", food_list_start)
                if closing_bracket_pos != -1:
                    content = content[:insert_pos] + "\n" + new_item + "\n" + content[closing_bracket_pos:]
        else:
            raise ValueError("Could not find food_list export in assets.js")

        # Write the updated content back to the file
        with open(ASSETS_JS_PATH, "w", encoding="utf-8") as f:
            f.write(content)
            
        return True
    except Exception as e:
        print(f"Error updating assets.js: {e}")
        return False

@app.post("/add_food_item")
async def add_food_item(
    id: str = Form(...),
    name: str = Form(...),
    price: float = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    image: UploadFile = File(...)
):
    try:
        # Validate inputs
        if not name.strip():
            raise HTTPException(status_code=400, detail="Name cannot be empty")
        if price <= 0:
            raise HTTPException(status_code=400, detail="Price must be greater than 0")
        if not description.strip():
            raise HTTPException(status_code=400, detail="Description cannot be empty")
            
        # Validate image file
        if not image.filename:
            raise HTTPException(status_code=400, detail="No image file provided")
            
        # Check file type
        allowed_types = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if image.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid image type. Only JPEG, PNG, and WEBP are allowed")

        # Ensure images directory exists
        os.makedirs(IMAGES_DIR, exist_ok=True)

        # Generate image filename
        file_extension = os.path.splitext(image.filename)[-1]
        image_filename = f"food_{id}{file_extension}"
        image_path = os.path.join(IMAGES_DIR, image_filename)

        # Save image file
        try:
            with open(image_path, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")

        # Prepare item data
        item_data = {
            "id": id,
            "name": name.strip(),
            "price": price,
            "description": description.strip(),
            "category": category,
            "image_filename": image_filename,
            "created_at": datetime.now().isoformat()
        }

        # Save to MongoDB
        try:
            food_collection.insert_one(item_data)
        except Exception as e:
            # Clean up image file if database save fails
            if os.path.exists(image_path):
                os.remove(image_path)
            raise HTTPException(status_code=500, detail=f"Failed to save to database: {str(e)}")

        # Update assets.js file
        assets_updated = update_assets_js(item_data, image_filename)
        
        if not assets_updated:
            print("Warning: Failed to update assets.js file")
            # Don't fail the entire operation, but log the warning
            
        return {
            "success": True, 
            "message": f"Item '{name}' added successfully",
            "item_id": id,
            "assets_updated": assets_updated
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in add_food_item: {e}")
        raise HTTPException(status_code=500, detail="Internal server error occurred")

# Get all food items
@app.get("/get_food_items")
def get_food_items():
    """Get all food items from database"""
    try:
        items = list(food_collection.find({}, {"_id": 0}))  # Exclude MongoDB's _id field
        return {"success": True, "items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve food items: {str(e)}")

# Delete food item
@app.delete("/delete_food_item/{item_id}")
def delete_food_item(item_id: str):
    """Delete a food item"""
    try:
        # Find the item first
        item = food_collection.find_one({"id": item_id})
        if not item:
            raise HTTPException(status_code=404, detail="Food item not found")
        
        # Delete from database
        result = food_collection.delete_one({"id": item_id})
        
        if result.deleted_count > 0:
            # Clean up image file
            image_path = os.path.join(IMAGES_DIR, item.get("image_filename", ""))
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except Exception as e:
                    print(f"Warning: Failed to delete image file: {e}")
            
            return {"success": True, "message": f"Item deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to delete item")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting item: {str(e)}")

# ==============================
# Order Placement Routes (Existing)
# ==============================

@app.post("/place_order")
async def place_order(order: PlaceOrderRequest):
    user = user_collection.find_one({"email": order.userEmail})
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please register first.")

    # Add status history for tracking
    order_data = order.dict()
    order_data["statusHistory"] = [
        {
            "status": order.status,
            "timestamp": datetime.now().isoformat(),
            "description": "Order placed and confirmed"
        }
    ]
    order_data["lastUpdated"] = datetime.now().isoformat()

    result = order_collection.insert_one(order_data)
    if result.inserted_id:
        return {"success": True, "orderId": order.orderId}
    else:
        raise HTTPException(status_code=500, detail="Order not saved due to server error.")

# ==============================
# Order Tracking Routes (Existing)
# ==============================

def serialize_order(order):
    if "_id" in order:
        order["_id"] = str(order["_id"])
    if isinstance(order.get("orderDate"), datetime):
        order["orderDate"] = order["orderDate"].isoformat()
    if isinstance(order.get("lastUpdated"), datetime):
        order["lastUpdated"] = order["lastUpdated"].isoformat()
    return order

@app.get("/track_order/{order_id}")
def track_order(order_id: str):
    """Track order by order ID"""
    order = order_collection.find_one({"orderId": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return serialize_order(order)

@app.post("/update_order_status")
def update_order_status(request: UpdateOrderStatusRequest):
    """Update order status with history tracking"""
    valid_statuses = ["confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]
    
    if request.status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status. Valid statuses are: {', '.join(valid_statuses)}"
        )
    
    order = order_collection.find_one({"orderId": request.orderId})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Status descriptions
    status_descriptions = {
        "confirmed": "Order confirmed and being processed",
        "preparing": "Your order is being prepared",
        "out_for_delivery": "Order is out for delivery",
        "delivered": "Order has been delivered successfully",
        "cancelled": "Order has been cancelled"
    }
    
    # Create new status entry
    new_status_entry = {
        "status": request.status,
        "timestamp": request.updatedAt or datetime.now().isoformat(),
        "description": status_descriptions.get(request.status, "Status updated")
    }
    
    # Update order with new status and add to history
    update_data = {
        "$set": {
            "status": request.status,
            "lastUpdated": datetime.now().isoformat()
        },
        "$push": {
            "statusHistory": new_status_entry
        }
    }
    
    result = order_collection.update_one(
        {"orderId": request.orderId},
        update_data
    )
    
    if result.modified_count > 0:
        updated_order = order_collection.find_one({"orderId": request.orderId})
        return {
            "success": True,
            "message": f"Order status updated to {request.status}",
            "order": serialize_order(updated_order)
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to update order status")

@app.get("/order_status/{order_id}")
def get_order_status(order_id: str):
    """Get current status of an order"""
    order = order_collection.find_one(
        {"orderId": order_id},
        {"orderId": 1, "status": 1, "statusHistory": 1, "lastUpdated": 1}
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return serialize_order(order)

@app.get("/orders_by_status")
def get_orders_by_status(status: str = Query(..., description="Order status to filter by")):
    """Get all orders with a specific status (admin/manager use)"""
    valid_statuses = ["confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"]
    
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid status. Valid statuses are: {', '.join(valid_statuses)}"
        )
    
    orders = list(order_collection.find({"status": status}).sort("orderDate", -1))
    return [serialize_order(order) for order in orders]

# ==============================
# Order Retrieval Routes (Existing)
# ==============================

@app.get("/get_user_orders")
def get_user_orders(userEmail: EmailStr, after: Optional[str] = Query(None)):
    query = {"userEmail": userEmail}
    if after:
        try:
            after_dt = datetime.fromisoformat(after)
            query["orderDate"] = {"$gt": after_dt.isoformat()}
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid 'after' timestamp format. Use ISO format.")

    orders = list(order_collection.find(query).sort("orderDate", -1))
    return [serialize_order(order) for order in orders]

@app.get("/get_latest_order")
def get_latest_order(userEmail: EmailStr):
    latest_order = order_collection.find_one(
        {"userEmail": userEmail},
        sort=[("orderDate", -1)]
    )
    if not latest_order:
        raise HTTPException(status_code=404, detail="No orders found for this user")
    return serialize_order(latest_order)

# ==============================
# Analytics Routes (Existing)
# ==============================

@app.get("/order_analytics")
def get_order_analytics():
    """Get order statistics for dashboard"""
    pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "total_amount": {"$sum": "$total"}
            }
        }
    ]
    
    analytics = list(order_collection.aggregate(pipeline))
    
    # Get total orders
    total_orders = order_collection.count_documents({})
    
    # Get today's orders
    today = datetime.now().strftime("%Y-%m-%d")
    today_orders = order_collection.count_documents({
        "orderDate": {"$regex": f"^{today}"}
    })
    
    return {
        "total_orders": total_orders,
        "today_orders": today_orders,
        "status_breakdown": analytics
    }

# ==============================
# Basic Endpoints
# ==============================

@app.get("/")
def root():
    return {"message": "FastAPI with MongoDB is running"}

@app.get("/health")
def health_check():
    try:
        client.server_info()
        return {"status": "healthy", "database": "connected"}
    except ServerSelectionTimeoutError:
        return {"status": "unhealthy", "database": "disconnected"}

"""const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: "*",
    credentials: true,
    methods: ["*"],
    allowedHeaders: ["*"]
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File paths
const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const FOOD_ITEMS_FILE = path.join(DATA_DIR, 'food_items.json');
const ASSETS_JS_PATH = './../src/assets/assets/assets.js';
const IMAGES_DIR = './../src/assets/assets';

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, IMAGES_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `food_${req.body.id}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid image type. Only JPEG, PNG, and WEBP are allowed'), false);
        }
    }
});

// ==============================
// Database Helper Functions
// ==============================

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

// ==============================
// Database Initialization
// ==============================

async function initializeDatabase() {
    await ensureDataDirectory();
    
    // Initialize users
    const users = await readJSONFile(USERS_FILE, []);
    if (users.length === 0) {
        const defaultUsers = [
            {
                userid: "admin",
                email: "admin@prep.com",
                password: "admin",
                role: "owner"
            },
            {
                userid: "testuser",
                email: "test@example.com",
                password: "password123",
                role: "user"
            }
        ];
        await writeJSONFile(USERS_FILE, defaultUsers);
        console.log("✅ Default users created.");
    } else {
        console.log("ℹ️ Users already exist in database.");
    }
    
    // Initialize other files
    await readJSONFile(ORDERS_FILE, []);
    await readJSONFile(FOOD_ITEMS_FILE, []);
    
    // Ensure images directory exists
    try {
        await fs.access(IMAGES_DIR);
    } catch {
        await fs.mkdir(IMAGES_DIR, { recursive: true });
    }
    
    console.log("✅ Database initialized.");
}

// ==============================
// Utility Functions
// ==============================

function generateId() {
    return uuidv4().replace(/-/g, '').substring(0, 12);
}

async function updateAssetsJS(itemData, imageFilename) {
    try {
        let content;
        
        // Check if assets.js exists
        try {
            content = await fs.readFile(ASSETS_JS_PATH, 'utf8');
        } catch (error) {
            if (error.code === 'ENOENT') {
                // Create initial assets.js file
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

        // Create import statement
        const importVarName = `food_${itemData.id}`;
        const imageImport = `import ${importVarName} from "./${imageFilename}";\n`;
        
        // Add import at the top if not already there
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

        // Create food item object
        const newItem = `    {
        _id: "${itemData.id}",
        name: "${itemData.name}",
        image: ${importVarName},
        price: ${itemData.price},
        description: "${itemData.description}",
        category: "${itemData.category}"
    },`;

        // Find the food_list array and add the new item
        if (content.includes("export const food_list = [")) {
            const foodListStart = content.indexOf("export const food_list = [") + "export const food_list = [".length;
            
            // Look for existing content
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
                // Add item at the beginning
                content = content.substring(0, foodListStart) + "\n" + newItem + content.substring(foodListStart);
            } else {
                // Empty array, add item
                const closingBracketPos = content.indexOf("];", foodListStart);
                if (closingBracketPos !== -1) {
                    content = content.substring(0, foodListStart) + "\n" + newItem + "\n" + content.substring(closingBracketPos);
                }
            }
        } else {
            throw new Error("Could not find food_list export in assets.js");
        }

        // Write the updated content back
        await fs.writeFile(ASSETS_JS_PATH, content, 'utf8');
        return true;
    } catch (error) {
        console.error(`Error updating assets.js: ${error.message}`);
        return false;
    }
}

function serializeOrder(order) {
    if (order.orderDate && typeof order.orderDate === 'object') {
        order.orderDate = order.orderDate.toISOString();
    }
    if (order.lastUpdated && typeof order.lastUpdated === 'object') {
        order.lastUpdated = order.lastUpdated.toISOString();
    }
    return order;
}

// ==============================
// Auth Routes
// ==============================

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const users = await readJSONFile(USERS_FILE);
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
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
    } catch (error) {
        res.status(500).json({ detail: "Internal server error" });
    }
});

app.post('/register', async (req, res) => {
    try {
        const { userid, password, email, role = "user" } = req.body;
        const users = await readJSONFile(USERS_FILE);
        
        if (users.find(u => u.userid === userid)) {
            return res.status(409).json({ detail: "User ID already exists" });
        }
        
        if (users.find(u => u.email === email)) {
            return res.status(409).json({ detail: "Email already exists" });
        }
        
        const validRoles = ["user", "manager", "owner"];
        const userRole = validRoles.includes(role) ? role : "user";
        
        const newUser = {
            userid,
            password,
            email,
            role: userRole
        };
        
        users.push(newUser);
        await writeJSONFile(USERS_FILE, users);
        
        res.json({
            status: "success",
            message: `User registered successfully as ${userRole}`
        });
    } catch (error) {
        res.status(500).json({ detail: "Internal server error" });
    }
});

// ==============================
// Food Item Management
// ==============================

app.post('/add_food_item', upload.single('image'), async (req, res) => {
    try {
        const { id, name, price, description, category } = req.body;
        const file = req.file;
        
        // Validate inputs
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
        
        const itemData = {
            id: id || generateId(),
            name: name.trim(),
            price: parseFloat(price),
            description: description.trim(),
            category,
            image_filename: file.filename,
            created_at: new Date().toISOString()
        };
        
        // Save to JSON database
        const foodItems = await readJSONFile(FOOD_ITEMS_FILE);
        foodItems.push(itemData);
        await writeJSONFile(FOOD_ITEMS_FILE, foodItems);
        
        // Update assets.js file
        const assetsUpdated = await updateAssetsJS(itemData, file.filename);
        
        if (!assetsUpdated) {
            console.log("Warning: Failed to update assets.js file");
        }
        
        res.json({
            success: true,
            message: `Item '${name}' added successfully`,
            item_id: itemData.id,
            assets_updated: assetsUpdated
        });
        
    } catch (error) {
        if (error.message.includes('Invalid image type')) {
            return res.status(400).json({ detail: error.message });
        }
        console.error(`Error in add_food_item: ${error.message}`);
        res.status(500).json({ detail: "Internal server error occurred" });
    }
});

app.get('/get_food_items', async (req, res) => {
    try {
        const items = await readJSONFile(FOOD_ITEMS_FILE);
        res.json({ success: true, items });
    } catch (error) {
        res.status(500).json({ detail: `Failed to retrieve food items: ${error.message}` });
    }
});

app.delete('/delete_food_item/:item_id', async (req, res) => {
    try {
        const { item_id } = req.params;
        const foodItems = await readJSONFile(FOOD_ITEMS_FILE);
        
        const itemIndex = foodItems.findIndex(item => item.id === item_id);
        if (itemIndex === -1) {
            return res.status(404).json({ detail: "Food item not found" });
        }
        
        const item = foodItems[itemIndex];
        
        // Remove from array
        foodItems.splice(itemIndex, 1);
        await writeJSONFile(FOOD_ITEMS_FILE, foodItems);
        
        // Clean up image file
        if (item.image_filename) {
            const imagePath = path.join(IMAGES_DIR, item.image_filename);
            try {
                await fs.unlink(imagePath);
            } catch (error) {
                console.log(`Warning: Failed to delete image file: ${error.message}`);
            }
        }
        
        res.json({ success: true, message: "Item deleted successfully" });
        
    } catch (error) {
        res.status(500).json({ detail: `Error deleting item: ${error.message}` });
    }
});

// ==============================
// Order Placement Routes
// ==============================

app.post('/place_order', async (req, res) => {
    try {
        const orderData = req.body;
        const users = await readJSONFile(USERS_FILE);
        
        const user = users.find(u => u.email === orderData.userEmail);
        if (!user) {
            return res.status(404).json({ detail: "User not found. Please register first." });
        }
        
        // Add status history for tracking
        orderData.statusHistory = [
            {
                status: orderData.status,
                timestamp: new Date().toISOString(),
                description: "Order placed and confirmed"
            }
        ];
        orderData.lastUpdated = new Date().toISOString();
        
        const orders = await readJSONFile(ORDERS_FILE);
        orders.push(orderData);
        await writeJSONFile(ORDERS_FILE, orders);
        
        res.json({ success: true, orderId: orderData.orderId });
        
    } catch (error) {
        res.status(500).json({ detail: "Order not saved due to server error." });
    }
});

// ==============================
// Order Tracking Routes
// ==============================

app.get('/track_order/:order_id', async (req, res) => {
    try {
        const { order_id } = req.params;
        const orders = await readJSONFile(ORDERS_FILE);
        
        const order = orders.find(o => o.orderId === order_id);
        if (!order) {
            return res.status(404).json({ detail: "Order not found" });
        }
        
        res.json(serializeOrder(order));
        
    } catch (error) {
        res.status(500).json({ detail: "Internal server error" });
    }
});

app.post('/update_order_status', async (req, res) => {
    try {
        const { orderId, status, updatedAt } = req.body;
        const validStatuses = ["confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                detail: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`
            });
        }
        
        const orders = await readJSONFile(ORDERS_FILE);
        const orderIndex = orders.findIndex(o => o.orderId === orderId);
        
        if (orderIndex === -1) {
            return res.status(404).json({ detail: "Order not found" });
        }
        
        const statusDescriptions = {
            "confirmed": "Order confirmed and being processed",
            "preparing": "Your order is being prepared",
            "out_for_delivery": "Order is out for delivery",
            "delivered": "Order has been delivered successfully",
            "cancelled": "Order has been cancelled"
        };
        
        const newStatusEntry = {
            status,
            timestamp: updatedAt || new Date().toISOString(),
            description: statusDescriptions[status] || "Status updated"
        };
        
        // Update order
        orders[orderIndex].status = status;
        orders[orderIndex].lastUpdated = new Date().toISOString();
        if (!orders[orderIndex].statusHistory) {
            orders[orderIndex].statusHistory = [];
        }
        orders[orderIndex].statusHistory.push(newStatusEntry);
        
        await writeJSONFile(ORDERS_FILE, orders);
        
        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            order: serializeOrder(orders[orderIndex])
        });
        
    } catch (error) {
        res.status(500).json({ detail: "Failed to update order status" });
    }
});

app.get('/order_status/:order_id', async (req, res) => {
    try {
        const { order_id } = req.params;
        const orders = await readJSONFile(ORDERS_FILE);
        
        const order = orders.find(o => o.orderId === order_id);
        if (!order) {
            return res.status(404).json({ detail: "Order not found" });
        }
        
        const orderStatus = {
            orderId: order.orderId,
            status: order.status,
            statusHistory: order.statusHistory,
            lastUpdated: order.lastUpdated
        };
        
        res.json(serializeOrder(orderStatus));
        
    } catch (error) {
        res.status(500).json({ detail: "Internal server error" });
    }
});

app.get('/orders_by_status', async (req, res) => {
    try {
        const { status } = req.query;
        const validStatuses = ["confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                detail: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`
            });
        }
        
        const orders = await readJSONFile(ORDERS_FILE);
        const filteredOrders = orders
            .filter(order => order.status === status)
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        
        res.json(filteredOrders.map(serializeOrder));
        
    } catch (error) {
        res.status(500).json({ detail: "Internal server error" });
    }
});

// ==============================
// Order Retrieval Routes
// ==============================

app.get('/get_user_orders', async (req, res) => {
    try {
        const { userEmail, after } = req.query;
        const orders = await readJSONFile(ORDERS_FILE);
        
        let filteredOrders = orders.filter(order => order.userEmail === userEmail);
        
        if (after) {
            try {
                const afterDate = new Date(after);
                filteredOrders = filteredOrders.filter(order => new Date(order.orderDate) > afterDate);
            } catch (error) {
                return res.status(400).json({ detail: "Invalid 'after' timestamp format. Use ISO format." });
            }
        }
        
        filteredOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        
        res.json(filteredOrders.map(serializeOrder));
        
    } catch (error) {
        res.status(500).json({ detail: "Internal server error" });
    }
});

app.get('/get_latest_order', async (req, res) => {
    try {
        const { userEmail } = req.query;
        const orders = await readJSONFile(ORDERS_FILE);
        
        const userOrders = orders
            .filter(order => order.userEmail === userEmail)
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        
        if (userOrders.length === 0) {
            return res.status(404).json({ detail: "No orders found for this user" });
        }
        
        res.json(serializeOrder(userOrders[0]));
        
    } catch (error) {
        res.status(500).json({ detail: "Internal server error" });
    }
});

// ==============================
// Analytics Routes
// ==============================

app.get('/order_analytics', async (req, res) => {
    try {
        const orders = await readJSONFile(ORDERS_FILE);
        
        // Group by status
        const statusBreakdown = orders.reduce((acc, order) => {
            const status = order.status;
            if (!acc[status]) {
                acc[status] = { _id: status, count: 0, total_amount: 0 };
            }
            acc[status].count++;
            acc[status].total_amount += order.total || 0;
            return acc;
        }, {});
        
        // Get today's orders
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(order => 
            order.orderDate && order.orderDate.startsWith(today)
        ).length;
        
        res.json({
            total_orders: orders.length,
            today_orders: todayOrders,
            status_breakdown: Object.values(statusBreakdown)
        });
        
    } catch (error) {
        res.status(500).json({ detail: "Internal server error" });
    }
});

// ==============================
// Basic Endpoints
// ==============================

app.get('/', (req, res) => {
    res.json({ message: "Express.js with JSON database is running" });
});

app.get('/health', (req, res) => {
    res.json({ status: "healthy", database: "json_files" });
});

// ==============================
// Server Startup
// ==============================

async function startServer() {
    try {
        await initializeDatabase();
        
        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`✅ Database initialized with JSON files`);
        });
    } catch (error) {
        console.error(`❌ Failed to start server: ${error.message}`);
        process.exit(1);
    }
}

startServer();"""