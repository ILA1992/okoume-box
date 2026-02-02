from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'afrobox-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# LLM Config
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI(title="AfroBox API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class BoxItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    image_url: str
    category: str  # decouverte, famille, solo
    region: str  # nord, sud, est, ouest
    serves: int
    prep_time: int  # minutes
    calories: int
    ingredients: List[str]
    recipe_steps: List[str]
    nutritional_info: dict
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_gluten_free: bool = False

class RecipeItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    image_url: str
    region: str
    author: str
    prep_time: int
    cook_time: int
    serves: int
    difficulty: str
    ingredients: List[str]
    instructions: List[str]
    tips: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CartItemAdd(BaseModel):
    box_id: str
    quantity: int = 1

class CartItemResponse(BaseModel):
    box_id: str
    name: str
    price: float
    quantity: int
    image_url: str

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total: float

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str

class OrderCreate(BaseModel):
    delivery_address: str
    delivery_date: str
    phone: str

class OrderResponse(BaseModel):
    id: str
    user_id: str
    items: List[CartItemResponse]
    total: float
    status: str
    delivery_address: str
    delivery_date: str
    created_at: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user_id, email=user_data.email, name=user_data.name, created_at=user_doc["created_at"])
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"])
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user["id"], email=user["email"], name=user["name"], created_at=user["created_at"])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    return UserResponse(id=user["id"], email=user["email"], name=user["name"], created_at=user["created_at"])

# ==================== BOXES ROUTES ====================

@api_router.get("/boxes", response_model=List[BoxItem])
async def get_boxes(category: Optional[str] = None, region: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if region:
        query["region"] = region
    boxes = await db.boxes.find(query, {"_id": 0}).to_list(100)
    return boxes

@api_router.get("/boxes/{box_id}", response_model=BoxItem)
async def get_box(box_id: str):
    box = await db.boxes.find_one({"id": box_id}, {"_id": 0})
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    return box

@api_router.get("/boxes/featured/list", response_model=List[BoxItem])
async def get_featured_boxes():
    boxes = await db.boxes.find({}, {"_id": 0}).to_list(6)
    return boxes

# ==================== RECIPES ROUTES ====================

@api_router.get("/recipes", response_model=List[RecipeItem])
async def get_recipes(region: Optional[str] = None):
    query = {}
    if region:
        query["region"] = region
    recipes = await db.recipes.find(query, {"_id": 0}).to_list(50)
    return recipes

@api_router.get("/recipes/{recipe_id}", response_model=RecipeItem)
async def get_recipe(recipe_id: str):
    recipe = await db.recipes.find_one({"id": recipe_id}, {"_id": 0})
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

# ==================== CART ROUTES ====================

@api_router.get("/cart", response_model=CartResponse)
async def get_cart(user=Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart or not cart.get("items"):
        return CartResponse(items=[], total=0)
    
    items = []
    total = 0
    for item in cart["items"]:
        box = await db.boxes.find_one({"id": item["box_id"]}, {"_id": 0})
        if box:
            cart_item = CartItemResponse(
                box_id=box["id"],
                name=box["name"],
                price=box["price"],
                quantity=item["quantity"],
                image_url=box["image_url"]
            )
            items.append(cart_item)
            total += box["price"] * item["quantity"]
    
    return CartResponse(items=items, total=total)

@api_router.post("/cart/add")
async def add_to_cart(item: CartItemAdd, user=Depends(get_current_user)):
    box = await db.boxes.find_one({"id": item.box_id}, {"_id": 0})
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    
    cart = await db.carts.find_one({"user_id": user["id"]})
    if not cart:
        await db.carts.insert_one({
            "user_id": user["id"],
            "items": [{"box_id": item.box_id, "quantity": item.quantity}]
        })
    else:
        existing_item = next((i for i in cart["items"] if i["box_id"] == item.box_id), None)
        if existing_item:
            await db.carts.update_one(
                {"user_id": user["id"], "items.box_id": item.box_id},
                {"$inc": {"items.$.quantity": item.quantity}}
            )
        else:
            await db.carts.update_one(
                {"user_id": user["id"]},
                {"$push": {"items": {"box_id": item.box_id, "quantity": item.quantity}}}
            )
    
    return {"message": "Item added to cart"}

@api_router.delete("/cart/{box_id}")
async def remove_from_cart(box_id: str, user=Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": user["id"]},
        {"$pull": {"items": {"box_id": box_id}}}
    )
    return {"message": "Item removed from cart"}

@api_router.put("/cart/{box_id}")
async def update_cart_quantity(box_id: str, quantity: int, user=Depends(get_current_user)):
    if quantity <= 0:
        await db.carts.update_one(
            {"user_id": user["id"]},
            {"$pull": {"items": {"box_id": box_id}}}
        )
    else:
        await db.carts.update_one(
            {"user_id": user["id"], "items.box_id": box_id},
            {"$set": {"items.$.quantity": quantity}}
        )
    return {"message": "Cart updated"}

# ==================== ORDERS ROUTES ====================

@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order_data: OrderCreate, user=Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["id"]}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    items = []
    total = 0
    for item in cart["items"]:
        box = await db.boxes.find_one({"id": item["box_id"]}, {"_id": 0})
        if box:
            cart_item = CartItemResponse(
                box_id=box["id"],
                name=box["name"],
                price=box["price"],
                quantity=item["quantity"],
                image_url=box["image_url"]
            )
            items.append(cart_item)
            total += box["price"] * item["quantity"]
    
    order_id = str(uuid.uuid4())
    order_doc = {
        "id": order_id,
        "user_id": user["id"],
        "items": [item.model_dump() for item in items],
        "total": total,
        "status": "pending",
        "delivery_address": order_data.delivery_address,
        "delivery_date": order_data.delivery_date,
        "phone": order_data.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)
    
    # Clear cart after order
    await db.carts.delete_one({"user_id": user["id"]})
    
    return OrderResponse(**{k: v for k, v in order_doc.items() if k != "phone"})

@api_router.get("/orders", response_model=List[OrderResponse])
async def get_orders(user=Depends(get_current_user)):
    orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0, "phone": 0}).to_list(50)
    return orders

# ==================== CHAT IA ROUTES ====================

chat_sessions = {}

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(chat_data: ChatMessage, user=Depends(get_current_user)):
    session_id = chat_data.session_id or str(uuid.uuid4())
    
    if session_id not in chat_sessions:
        chat_sessions[session_id] = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message="""Tu es un assistant nutritionniste spécialisé dans la cuisine africaine saine. 
Tu aides les clients d'AfroBox à personnaliser leurs box alimentaires selon leurs besoins:
- Poids et taille pour calculer les besoins caloriques
- Objectifs santé (perte de poids, prise de masse, maintien)
- Régimes spécifiques (végétarien, vegan, sans gluten)
- Allergies et intolérances alimentaires
- Préférences régionales (Nord, Sud, Est, Ouest de l'Afrique)

Tu recommandes des plats africains équilibrés, pas trop gras ni trop sucrés, mais savoureux.
Sois chaleureux, encourageant et expert en nutrition africaine.
Réponds toujours en français."""
        ).with_model("openai", "gpt-5.2")
    
    chat = chat_sessions[session_id]
    
    try:
        user_message = UserMessage(text=chat_data.message)
        response = await chat.send_message(user_message)
        
        # Store message in database
        await db.chat_history.insert_one({
            "session_id": session_id,
            "user_id": user["id"],
            "user_message": chat_data.message,
            "ai_response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return ChatResponse(response=response, session_id=session_id)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Erreur de communication avec l'assistant")

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str, user=Depends(get_current_user)):
    history = await db.chat_history.find(
        {"session_id": session_id, "user_id": user["id"]},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    return history

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    # Check if already seeded
    existing_boxes = await db.boxes.count_documents({})
    if existing_boxes > 0:
        return {"message": "Data already seeded"}
    
    boxes = [
        {
            "id": "box-jollof-discovery",
            "name": "Box Découverte Jollof",
            "description": "Découvrez le fameux riz Jollof ouest-africain dans une version allégée mais tout aussi savoureuse. Épices douces, légumes frais et protéines maigres.",
            "price": 29.90,
            "image_url": "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800",
            "category": "decouverte",
            "region": "ouest",
            "serves": 2,
            "prep_time": 45,
            "calories": 450,
            "ingredients": ["Riz basmati", "Tomates fraîches", "Oignons", "Poivrons", "Épices Jollof", "Poulet fermier", "Huile d'olive"],
            "recipe_steps": ["Faire revenir les oignons", "Ajouter les tomates et épices", "Cuire le riz dans la sauce", "Griller le poulet séparément", "Servir ensemble"],
            "nutritional_info": {"proteins": 35, "carbs": 55, "fats": 12, "fiber": 8},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        {
            "id": "box-tagine-famille",
            "name": "Box Famille Tagine",
            "description": "Un tagine marocain traditionnel revisité pour toute la famille. Agneau tendre, légumes de saison et épices du Maghreb.",
            "price": 49.90,
            "image_url": "https://images.unsplash.com/photo-1651718543197-f567aeaa4fb0?w=800",
            "category": "famille",
            "region": "nord",
            "serves": 4,
            "prep_time": 60,
            "calories": 380,
            "ingredients": ["Agneau maigre", "Carottes", "Courgettes", "Pruneaux", "Amandes", "Ras el hanout", "Coriandre fraîche"],
            "recipe_steps": ["Faire dorer l'agneau", "Ajouter les épices", "Incorporer les légumes", "Mijoter 45 minutes", "Garnir de pruneaux et amandes"],
            "nutritional_info": {"proteins": 42, "carbs": 35, "fats": 18, "fiber": 12},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        {
            "id": "box-yassa-solo",
            "name": "Box Solo Yassa",
            "description": "Le poulet Yassa sénégalais, mariné au citron et aux oignons caramélisés. Une explosion de saveurs en portion individuelle.",
            "price": 18.90,
            "image_url": "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800",
            "category": "solo",
            "region": "ouest",
            "serves": 1,
            "prep_time": 35,
            "calories": 420,
            "ingredients": ["Poulet fermier", "Oignons", "Citrons", "Moutarde de Dijon", "Olives vertes", "Riz complet"],
            "recipe_steps": ["Mariner le poulet dans le citron", "Caraméliser les oignons", "Griller le poulet", "Mélanger avec les oignons", "Servir avec riz"],
            "nutritional_info": {"proteins": 38, "carbs": 40, "fats": 14, "fiber": 6},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        {
            "id": "box-mafe-decouverte",
            "name": "Box Découverte Mafé",
            "description": "Le ragoût à la pâte d'arachide du Sénégal, version légère avec légumes croquants et poulet grillé.",
            "price": 27.90,
            "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
            "category": "decouverte",
            "region": "ouest",
            "serves": 2,
            "prep_time": 50,
            "calories": 480,
            "ingredients": ["Poulet", "Pâte d'arachide naturelle", "Tomates", "Patates douces", "Chou", "Carottes", "Épices mafé"],
            "recipe_steps": ["Faire revenir le poulet", "Préparer la sauce arachide", "Ajouter les légumes", "Mijoter 30 minutes", "Ajuster l'assaisonnement"],
            "nutritional_info": {"proteins": 32, "carbs": 48, "fats": 22, "fiber": 10},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        {
            "id": "box-injera-ethiopie",
            "name": "Box Éthiopienne Injera",
            "description": "L'expérience éthiopienne authentique avec injera (crêpe de teff) et assortiment de wat (ragoûts) aux épices berbère.",
            "price": 32.90,
            "image_url": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
            "category": "decouverte",
            "region": "est",
            "serves": 2,
            "prep_time": 55,
            "calories": 390,
            "ingredients": ["Farine de teff", "Lentilles corail", "Épices berbère", "Gingembre", "Ail", "Tomates", "Épinards"],
            "recipe_steps": ["Préparer la pâte d'injera", "Cuire les lentilles épicées", "Préparer le wat aux épinards", "Faire cuire les injera", "Dresser l'assiette"],
            "nutritional_info": {"proteins": 28, "carbs": 52, "fats": 10, "fiber": 14},
            "is_vegetarian": True,
            "is_vegan": True,
            "is_gluten_free": True
        },
        {
            "id": "box-bobotie-sud",
            "name": "Box Bobotie Sud-Africain",
            "description": "Le plat national sud-africain: un gratin de viande épicée aux influences malaises, garni d'une crème aux œufs.",
            "price": 34.90,
            "image_url": "https://images.unsplash.com/photo-1574484284002-952d92456975?w=800",
            "category": "famille",
            "region": "sud",
            "serves": 4,
            "prep_time": 65,
            "calories": 410,
            "ingredients": ["Bœuf haché maigre", "Oignons", "Curry", "Curcuma", "Raisins secs", "Amandes", "Œufs", "Lait"],
            "recipe_steps": ["Faire revenir la viande avec épices", "Ajouter les fruits secs", "Verser dans un plat", "Préparer la garniture aux œufs", "Gratiner au four"],
            "nutritional_info": {"proteins": 36, "carbs": 30, "fats": 20, "fiber": 5},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        }
    ]
    
    recipes = [
        {
            "id": "recipe-thieboudienne",
            "title": "Thiéboudiène - Le Roi des Plats Sénégalais",
            "description": "Le plat national sénégalais, un riz au poisson parfumé aux légumes et aux épices. Version allégée pour une alimentation équilibrée.",
            "image_url": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
            "region": "ouest",
            "author": "Chef Fatou Diallo",
            "prep_time": 30,
            "cook_time": 60,
            "serves": 4,
            "difficulty": "Intermédiaire",
            "ingredients": ["500g de poisson (thiof ou mérou)", "400g de riz brisé", "200g de chou", "2 carottes", "1 aubergine", "Concentré de tomate", "Persil", "Ail", "Piment"],
            "instructions": ["Préparer la farce au persil et ail", "Farcir le poisson et le faire frire légèrement", "Préparer la sauce tomate aux épices", "Cuire les légumes dans la sauce", "Cuire le riz dans le bouillon de poisson"],
            "tips": "Le secret est dans la cuisson lente du riz qui absorbe toutes les saveurs."
        },
        {
            "id": "recipe-couscous-royal",
            "title": "Couscous Royal Allégé",
            "description": "Le couscous marocain traditionnel avec viandes et légumes, revisité pour être moins gras mais toujours aussi délicieux.",
            "image_url": "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800",
            "region": "nord",
            "author": "Chef Amina Benali",
            "prep_time": 45,
            "cook_time": 90,
            "serves": 6,
            "difficulty": "Avancé",
            "ingredients": ["500g de semoule", "300g d'agneau maigre", "200g de poulet", "Merguez légères", "Pois chiches", "Navets", "Courgettes", "Carottes", "Épices couscous"],
            "instructions": ["Préparer le bouillon aux épices", "Cuire les viandes séparément", "Vapeur la semoule 3 fois", "Cuire les légumes al dente", "Dresser en pyramide"],
            "tips": "Vaporiser la semoule plusieurs fois la rend légère et aérée."
        },
        {
            "id": "recipe-doro-wat",
            "title": "Doro Wat - Poulet Éthiopien",
            "description": "Le ragoût de poulet épicé éthiopien, parfait avec l'injera. Une recette riche en saveurs mais pauvre en matières grasses.",
            "image_url": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800",
            "region": "est",
            "author": "Chef Tigist Haile",
            "prep_time": 20,
            "cook_time": 45,
            "serves": 4,
            "difficulty": "Facile",
            "ingredients": ["1 poulet entier découpé", "6 oignons rouges", "Berbere (mélange d'épices)", "Beurre clarifié (niter kibbeh)", "Œufs durs", "Gingembre", "Ail"],
            "instructions": ["Caraméliser les oignons longuement", "Ajouter le berbere et faire revenir", "Incorporer le poulet", "Mijoter jusqu'à cuisson", "Ajouter les œufs durs"],
            "tips": "La caramélisation des oignons pendant 45 minutes est le secret de ce plat."
        },
        {
            "id": "recipe-chakalaka",
            "title": "Chakalaka Sud-Africain",
            "description": "Un plat végétarien épicé d'Afrique du Sud, parfait comme accompagnement ou plat principal léger.",
            "image_url": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800",
            "region": "sud",
            "author": "Chef Thabo Molefe",
            "prep_time": 15,
            "cook_time": 30,
            "serves": 4,
            "difficulty": "Facile",
            "ingredients": ["2 poivrons", "1 boîte de haricots", "3 tomates", "2 carottes râpées", "Curry", "Piment", "Oignons", "Ail"],
            "instructions": ["Faire revenir les oignons", "Ajouter les poivrons et carottes", "Incorporer les tomates et épices", "Ajouter les haricots", "Mijoter 15 minutes"],
            "tips": "Servir chaud ou froid, c'est délicieux dans les deux cas!"
        }
    ]
    
    await db.boxes.insert_many(boxes)
    await db.recipes.insert_many(recipes)
    
    return {"message": "Data seeded successfully", "boxes": len(boxes), "recipes": len(recipes)}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Bienvenue sur l'API AfroBox!", "version": "1.0.0"}

# Include router and setup
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
