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

