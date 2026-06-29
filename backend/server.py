from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
# emergentintegrations removed — chat IA uses fallback mode

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db_name = os.environ.get('DB_NAME', 'okoume_box')
db = client[db_name]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'okoumebox-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# LLM Config
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI(title="Okoumé Box API")
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
    category: str  # decouverte, famille, signature, multi-pays
    country: str  # gabon, cameroun, cote-ivoire, congo, senegal, multi
    country_flag: str = ""  # emoji flag
    serves: int
    prep_time: int  # minutes
    calories: int
    ingredients: List[str]
    recipe_steps: List[str]
    dishes: List[dict] = []  # Liste des plats inclus dans la box
    nutritional_info: dict
    highlights: List[str] = []  # Points forts de la box
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_gluten_free: bool = False

class RecipeItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    image_url: str
    country: str
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

# === SUBSCRIPTION MODELS ===
class SubscriptionPlan(BaseModel):
    id: str
    name: str
    description: str
    price_monthly: float
    price_quarterly: float  # -10%
    price_yearly: float     # -20%
    boxes_per_month: int
    features: List[str]
    is_popular: bool = False

class SubscriptionCreate(BaseModel):
    plan_id: str
    billing_cycle: str  # monthly, quarterly, yearly
    delivery_address: str
    phone: str
    preferred_countries: List[str] = []  # préférences de pays

class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    plan_id: str
    plan_name: str
    billing_cycle: str
    price: float
    status: str  # active, paused, cancelled
    delivery_address: str
    preferred_countries: List[str]
    next_delivery_date: str
    created_at: str

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

# ==================== BOXES ROUTES ====================

@api_router.get("/boxes", response_model=List[BoxItem])
async def get_boxes(category: Optional[str] = None, country: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    if country:
        query["country"] = country
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

@api_router.get("/countries")
async def get_countries():
    return [
        {"id": "gabon", "name": "Gabon", "flag": "🇬🇦"},
        {"id": "cameroun", "name": "Cameroun", "flag": "🇨🇲"},
        {"id": "cote-ivoire", "name": "Côte d'Ivoire", "flag": "🇨🇮"},
        {"id": "congo", "name": "Congo", "flag": "🇨🇩"},
        {"id": "senegal", "name": "Sénégal", "flag": "🇸🇳"},
        {"id": "multi", "name": "Multi-Pays", "flag": "🌍"}
    ]

@api_router.get("/african-dishes")
async def get_african_dishes():
    data_path = ROOT_DIR.parent / "plats_africains.json"
    try:
        with open(data_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="African dishes dataset not found")
    return data

# ==================== RECIPES ROUTES ====================

@api_router.get("/recipes", response_model=List[RecipeItem])
async def get_recipes(country: Optional[str] = None):
    query = {}
    if country:
        query["country"] = country
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

CHAT_RESPONSES = [
    "Bonjour ! Je suis votre assistant Okoumé Box. Pour personnaliser votre box, dites-moi vos préférences alimentaires (végétarien, sans gluten...) ou vos objectifs santé.",
    "Excellente question ! La cuisine africaine est naturellement riche en nutriments. Nos boxes incluent des plats équilibrés adaptés à vos besoins.",
    "Je vous recommande d'explorer notre catalogue pour découvrir nos boxes signature. Chaque box est préparée avec des ingrédients frais et authentiques.",
    "Pour toute question sur vos commandes ou abonnements, notre équipe est disponible. N'hésitez pas à consulter votre profil pour gérer vos préférences.",
]

@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(chat_data: ChatMessage, user=Depends(get_current_user)):
    session_id = chat_data.session_id or str(uuid.uuid4())

    import random
    response = random.choice(CHAT_RESPONSES)

    # Store message in database
    await db.chat_history.insert_one({
        "session_id": session_id,
        "user_id": user["id"],
        "user_message": chat_data.message,
        "ai_response": response,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return ChatResponse(response=response, session_id=session_id)

@api_router.get("/chat/history/{session_id}")
async def get_chat_history(session_id: str, user=Depends(get_current_user)):
    history = await db.chat_history.find(
        {"session_id": session_id, "user_id": user["id"]},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(100)
    return history

# ==================== SUBSCRIPTION ROUTES ====================

SUBSCRIPTION_PLANS = [
    {
        "id": "decouverte",
        "name": "Découverte",
        "description": "Idéal pour découvrir les saveurs africaines. 1 box au choix par mois.",
        "price_monthly": 29.00,
        "price_quarterly": 78.30,  # -10%
        "price_yearly": 278.40,    # -20%
        "boxes_per_month": 1,
        "features": ["1 box par mois", "Livraison gratuite", "Recettes détaillées", "Support client"],
        "is_popular": False
    },
    {
        "id": "gourmet",
        "name": "Gourmet",
        "description": "Pour les amateurs. 2 box par mois avec -15% sur le prix unitaire.",
        "price_monthly": 49.00,
        "price_quarterly": 132.30,
        "price_yearly": 470.40,
        "boxes_per_month": 2,
        "features": ["2 box par mois", "-15% sur chaque box", "Livraison gratuite", "Accès prioritaire nouveautés", "Recettes exclusives"],
        "is_popular": True
    },
    {
        "id": "famille",
        "name": "Famille",
        "description": "Parfait pour les familles. 4 box par mois avec -25% sur le prix.",
        "price_monthly": 89.00,
        "price_quarterly": 240.30,
        "price_yearly": 854.40,
        "boxes_per_month": 4,
        "features": ["4 box par mois", "-25% sur chaque box", "Livraison gratuite", "Accès VIP", "Conseils nutritionniste IA illimités", "Cadeaux surprise"],
        "is_popular": False
    }
]

@api_router.get("/subscriptions/plans")
async def get_subscription_plans():
    return SUBSCRIPTION_PLANS

@api_router.post("/subscriptions", response_model=SubscriptionResponse)
async def create_subscription(sub_data: SubscriptionCreate, user=Depends(get_current_user)):
    # Find plan
    plan = next((p for p in SUBSCRIPTION_PLANS if p["id"] == sub_data.plan_id), None)
    if not plan:
        raise HTTPException(status_code=400, detail="Plan non trouvé")
    
    # Calculate price based on billing cycle
    if sub_data.billing_cycle == "monthly":
        price = plan["price_monthly"]
    elif sub_data.billing_cycle == "quarterly":
        price = plan["price_quarterly"]
    elif sub_data.billing_cycle == "yearly":
        price = plan["price_yearly"]
    else:
        raise HTTPException(status_code=400, detail="Cycle de facturation invalide")
    
    # Check if user already has active subscription
    existing = await db.subscriptions.find_one({"user_id": user["id"], "status": "active"})
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà un abonnement actif")
    
    # Calculate next delivery date (next week)
    next_delivery = (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")
    
    sub_id = str(uuid.uuid4())
    sub_doc = {
        "id": sub_id,
        "user_id": user["id"],
        "plan_id": sub_data.plan_id,
        "plan_name": plan["name"],
        "billing_cycle": sub_data.billing_cycle,
        "price": price,
        "status": "active",
        "delivery_address": sub_data.delivery_address,
        "phone": sub_data.phone,
        "preferred_countries": sub_data.preferred_countries,
        "next_delivery_date": next_delivery,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.subscriptions.insert_one(sub_doc)
    
    return SubscriptionResponse(**{k: v for k, v in sub_doc.items() if k != "phone"})

@api_router.get("/subscriptions/my", response_model=Optional[SubscriptionResponse])
async def get_my_subscription(user=Depends(get_current_user)):
    sub = await db.subscriptions.find_one({"user_id": user["id"], "status": {"$in": ["active", "paused"]}}, {"_id": 0, "phone": 0})
    if not sub:
        return None
    return sub

@api_router.put("/subscriptions/pause")
async def pause_subscription(user=Depends(get_current_user)):
    result = await db.subscriptions.update_one(
        {"user_id": user["id"], "status": "active"},
        {"$set": {"status": "paused"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Aucun abonnement actif trouvé")
    return {"message": "Abonnement mis en pause"}

@api_router.put("/subscriptions/resume")
async def resume_subscription(user=Depends(get_current_user)):
    result = await db.subscriptions.update_one(
        {"user_id": user["id"], "status": "paused"},
        {"$set": {"status": "active", "next_delivery_date": (datetime.now(timezone.utc) + timedelta(days=7)).strftime("%Y-%m-%d")}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Aucun abonnement en pause trouvé")
    return {"message": "Abonnement réactivé"}

@api_router.delete("/subscriptions/cancel")
async def cancel_subscription(user=Depends(get_current_user)):
    result = await db.subscriptions.update_one(
        {"user_id": user["id"], "status": {"$in": ["active", "paused"]}},
        {"$set": {"status": "cancelled"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail="Aucun abonnement trouvé")
    return {"message": "Abonnement annulé"}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    # Clear existing data and reseed
    await db.boxes.delete_many({})
    await db.recipes.delete_many({})
    
    boxes = [
        # === BOX DÉCOUVERTE SPÉCIALE ===
        {
            "id": "box-decouverte-5-pays",
            "name": "BOX DÉCOUVERTE — 5 Pays en 1",
            "description": "L'initiation parfaite ! Goûtez 1 plat emblématique de chaque pays : Gabon, Cameroun, Côte d'Ivoire, Congo et Sénégal. Idéal pour découvrir l'Afrique.",
            "price": 29.00,
            "image_url": "https://images.unsplash.com/photo-1567364816519-cbc8c6a73615?w=800&q=85",
            "category": "decouverte",
            "country": "multi",
            "country_flag": "🌍",
            "serves": 2,
            "prep_time": 45,
            "calories": 380,
            "ingredients": ["Mini portion Nyembwe (Gabon)", "Mini Ndolé (Cameroun)", "Mini Attiéké-Garba (Côte d'Ivoire)", "Mini Pondu (Congo)", "Mini Thiéboudienne (Sénégal)"],
            "recipe_steps": ["Préparer chaque plat selon sa recette", "Présenter en format dégustation", "Accompagner de riz ou foutou", "Déguster et voyager !"],
            "dishes": [
                {"name": "Poulet Nyembwe", "desc": "🇬🇦 Gabon — Sauce noix de palme"},
                {"name": "Ndolé aux crevettes", "desc": "🇨🇲 Cameroun — Feuilles amères"},
                {"name": "Garba", "desc": "🇨🇮 Côte d'Ivoire — Attiéké au thon"},
                {"name": "Pondu", "desc": "🇨🇩 Congo — Feuilles de manioc"},
                {"name": "Thiéboudienne", "desc": "🇸🇳 Sénégal — Riz au poisson UNESCO"}
            ],
            "highlights": ["5 pays en 1 box", "Prix découverte -50%", "Parfait pour débuter", "Portions dégustation"],
            "nutritional_info": {"proteins": 32, "carbs": 45, "fats": 14, "fiber": 12},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        # === GABON ===
        {
            "id": "box-nyembwe",
            "name": "BOX NYEMBWE — L'Or du Gabon",
            "description": "Le Nyembwe est la sauce emblématique à base de noix de palme. Version allégée -40% d'huile de palme, cuisson vapeur.",
            "price": 65.00,
            "image_url": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=85",
            "category": "signature",
            "country": "gabon",
            "country_flag": "🇬🇦",
            "serves": 2,
            "prep_time": 60,
            "calories": 420,
            "ingredients": ["Nyembwe (pâte de palme)", "Odika (mangue sauvage)", "Piment", "Poulet fermier", "Poisson d'eau douce", "Feuilles de manioc", "Bâtons de manioc", "Banane plantain", "Riz"],
            "recipe_steps": ["Préparer la pâte de nyembwe allégée", "Cuire le poulet à la vapeur puis dans la sauce", "Préparer le poisson en papillote", "Piler les feuilles de manioc", "Servir avec accompagnements"],
            "dishes": [
                {"name": "Poulet Nyembwe", "desc": "Poulet mijoté dans la sauce de noix de palme"},
                {"name": "Poisson au Nyembwe", "desc": "Carpe ou capitaine en sauce"},
                {"name": "Feuilles de Koko", "desc": "Feuilles de manioc pilées au poisson fumé"},
                {"name": "Odika", "desc": "Sauce au chocolat africain (mangue sauvage)"}
            ],
            "highlights": ["Version allégée -40% d'huile de palme", "Cuisson vapeur", "4 recettes incluses"],
            "nutritional_info": {"proteins": 38, "carbs": 45, "fats": 18, "fiber": 12},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        {
            "id": "box-nkumu-ngondo",
            "name": "BOX NKUMU & NGONDO — Saveurs de la Forêt",
            "description": "Les trésors végétaux de la forêt équatoriale. Recettes de brousse revisitées healthy.",
            "price": 59.00,
            "image_url": "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=85",
            "category": "decouverte",
            "country": "gabon",
            "country_flag": "🇬🇦",
            "serves": 2,
            "prep_time": 55,
            "calories": 380,
            "ingredients": ["Nkumu (feuilles)", "Ngondo (courge locale)", "Poisson fumé", "Manioc", "Taros", "Banane Malangwa"],
            "recipe_steps": ["Préparer le Nkumu au poisson", "Cuisiner la courge Ngondo", "Braiser le manioc", "Préparer la banane Malangwa"],
            "dishes": [
                {"name": "Nkumu au poisson", "desc": "Feuilles locales au poisson fumé"},
                {"name": "Ngondo", "desc": "Courge locale en sauce"},
                {"name": "Manioc braisé", "desc": "Manioc doré légèrement"},
                {"name": "Banane Malangwa", "desc": "Banane plantain préparée traditionnellement"}
            ],
            "highlights": ["Recettes de brousse revisitées", "Produits de la forêt", "Healthy"],
            "nutritional_info": {"proteins": 28, "carbs": 52, "fats": 12, "fiber": 15},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        # === CAMEROUN ===
        {
            "id": "box-ndole-royal",
            "name": "BOX NDOLÉ ROYAL — Le Plat National",
            "description": "Le Ndolé est LE plat emblématique du Cameroun. Feuilles amères détox, protéines variées.",
            "price": 62.00,
            "image_url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=85",
            "category": "signature",
            "country": "cameroun",
            "country_flag": "🇨🇲",
            "serves": 2,
            "prep_time": 70,
            "calories": 450,
            "ingredients": ["Feuilles de Ndolé", "Njansang", "Pèbè", "Arachides", "Crevettes fraîches", "Bœuf maigre", "Miondo", "Plantain mûr", "Bobolo"],
            "recipe_steps": ["Blanchir les feuilles de Ndolé", "Préparer la pâte d'arachide", "Cuire les crevettes", "Mijoter le bœuf", "Assembler et servir"],
            "dishes": [
                {"name": "Ndolé aux crevettes & arachides", "desc": "Feuilles amères, crevettes fraîches, pâte d'arachide"},
                {"name": "Ndolé au bœuf", "desc": "Version viande rouge maigre"},
                {"name": "Eru (Okok)", "desc": "Feuilles d'eru aux peaux de bœuf et poisson fumé"},
                {"name": "Kondré", "desc": "Banane plantain verte au bœuf"}
            ],
            "highlights": ["Feuilles amères détox", "Protéines variées", "Plat national"],
            "nutritional_info": {"proteins": 42, "carbs": 38, "fats": 22, "fiber": 14},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        {
            "id": "box-poulet-dg",
            "name": "BOX POULET DG & BRAISÉS — Street Food",
            "description": "DG = Directeur Général, le plat des grandes occasions. Cuisson au four (pas frit), marinade authentique.",
            "price": 58.00,
            "image_url": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=85",
            "category": "signature",
            "country": "cameroun",
            "country_flag": "🇨🇲",
            "serves": 2,
            "prep_time": 50,
            "calories": 480,
            "ingredients": ["Poulet fermier", "Plantain", "Poivre blanc", "Piment", "Gingembre", "Ail", "Maquereau", "Bœuf pour brochettes"],
            "recipe_steps": ["Mariner le poulet", "Préparer les légumes", "Cuire au four", "Griller le poisson", "Préparer les brochettes Soya"],
            "dishes": [
                {"name": "Poulet DG", "desc": "Poulet sauté aux légumes et plantain"},
                {"name": "Poisson braisé", "desc": "Maquereau ou bar mariné, grillé"},
                {"name": "Soya", "desc": "Brochettes de bœuf épicées (street food)"},
                {"name": "Pilé de pommes & plantain", "desc": "Purée mixte traditionnelle"}
            ],
            "highlights": ["Cuisson au four", "Marinade authentique", "Street food camerounaise"],
            "nutritional_info": {"proteins": 45, "carbs": 42, "fats": 20, "fiber": 8},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        {
            "id": "box-koki-ekwang",
            "name": "BOX KOKI & EKWANG — Spécialités Bamiléké",
            "description": "Les papillotes traditionnelles de l'Ouest Cameroun. Cuisson vapeur en feuilles de bananier.",
            "price": 64.00,
            "image_url": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=85",
            "category": "signature",
            "country": "cameroun",
            "country_flag": "🇨🇲",
            "serves": 2,
            "prep_time": 65,
            "calories": 410,
            "ingredients": ["Cornilles (niébé)", "Taro", "Épinards", "Épices brûlées", "Poisson fumé", "Manioc", "Feuilles de bananier"],
            "recipe_steps": ["Préparer la pâte de Koki", "Râper le taro pour l'Ekwang", "Cuire en papillotes vapeur", "Préparer le Mbongo Tchobi", "Assembler le Nnam Ngon"],
            "dishes": [
                {"name": "Koki", "desc": "Gâteau de cornilles (niébé) cuit en feuilles"},
                {"name": "Ekwang", "desc": "Taro râpé aux épinards et viande/poisson"},
                {"name": "Mbongo Tchobi", "desc": "Poulet en sauce noire aux épices brûlées"},
                {"name": "Nnam Ngon", "desc": "Pâte de manioc au poisson fumé en papillote"}
            ],
            "highlights": ["Cuisson vapeur", "Feuilles de bananier", "Traditions Bamiléké & Bassa"],
            "nutritional_info": {"proteins": 35, "carbs": 48, "fats": 16, "fiber": 12},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        # === CÔTE D'IVOIRE ===
        {
            "id": "box-garba-attieke",
            "name": "BOX GARBA & ATTIÉKÉ — L'Incontournable",
            "description": "L'Attiéké est le couscous de manioc national. Attiéké artisanal, cuisson kédjénou sans matière grasse.",
            "price": 56.00,
            "image_url": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=85",
            "category": "signature",
            "country": "cote-ivoire",
            "country_flag": "🇨🇮",
            "serves": 2,
            "prep_time": 45,
            "calories": 420,
            "ingredients": ["Attiéké artisanal", "Thon frais", "Piment frais", "Oignons", "Poisson entier", "Poulet fermier", "Banane plantain", "Sauce graine"],
            "recipe_steps": ["Préparer l'attiéké", "Frire et émietter le thon", "Braiser le poisson entier", "Cuire le Kédjénou en cocotte fermée", "Préparer la sauce graine légère"],
            "dishes": [
                {"name": "Garba", "desc": "Attiéké + thon frit émietté + piment + oignon"},
                {"name": "Attiéké poisson braisé", "desc": "Attiéké + poisson grillé entier"},
                {"name": "Kédjénou de poulet", "desc": "Poulet mijoté en cocotte sans eau ni huile"},
                {"name": "Foutou banane sauce graine", "desc": "Purée de banane + sauce palme légère"}
            ],
            "highlights": ["Attiéké artisanal", "Kédjénou sans matière grasse", "Cuisson saine"],
            "nutritional_info": {"proteins": 38, "carbs": 50, "fats": 14, "fiber": 10},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        {
            "id": "box-sauce-claire",
            "name": "BOX SAUCE CLAIRE & AGOUTI — Terroir",
            "description": "Les sauces légères et gibiers de Côte d'Ivoire. Sauces légères à base d'aubergines et tomates.",
            "price": 54.00,
            "image_url": "https://images.unsplash.com/photo-1567364816519-cbc8c6a73615?w=800&q=85",
            "category": "decouverte",
            "country": "cote-ivoire",
            "country_flag": "🇨🇮",
            "serves": 2,
            "prep_time": 50,
            "calories": 360,
            "ingredients": ["Poulet", "Aubergines", "Poisson fumé", "Tomates", "Feuilles de corète", "Foutou igname", "Placali", "Riz"],
            "recipe_steps": ["Préparer la sauce claire", "Écraser les aubergines pour le Kopè", "Cuire la soupe de poisson", "Préparer le Biékosseu"],
            "dishes": [
                {"name": "Sauce claire", "desc": "Bouillon léger tomate-oignon au poulet"},
                {"name": "Sauce Kopè", "desc": "Aubergines écrasées au poisson fumé"},
                {"name": "Soupe de poisson", "desc": "Bouillon épicé de poissons variés"},
                {"name": "Biékosseu", "desc": "Feuilles de corète + poisson fumé"}
            ],
            "highlights": ["Sauces légères", "Base aubergines et tomates", "Saveurs du terroir"],
            "nutritional_info": {"proteins": 32, "carbs": 42, "fats": 12, "fiber": 14},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        # === CONGO ===
        {
            "id": "box-pondu-saka-saka",
            "name": "BOX PONDU & SAKA SAKA — Le Goût du Congo",
            "description": "Les feuilles de manioc sous toutes leurs formes. Cuisson en papillote (Liboke), version légère.",
            "price": 61.00,
            "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=85",
            "category": "signature",
            "country": "congo",
            "country_flag": "🇨🇩",
            "serves": 2,
            "prep_time": 60,
            "calories": 400,
            "ingredients": ["Feuilles de manioc", "Huile de palme légère", "Piment", "Poulet", "Poisson frais", "Viande de chèvre", "Fufu de maïs", "Chikwangue"],
            "recipe_steps": ["Piler les feuilles de manioc", "Préparer la sauce Mwambe", "Cuire le poisson en Liboke", "Mijoter la viande Ntaba"],
            "dishes": [
                {"name": "Pondu / Saka Saka", "desc": "Feuilles de manioc pilées au poisson fumé"},
                {"name": "Mwambe / Moambe", "desc": "Poulet en sauce de noix de palme"},
                {"name": "Liboke", "desc": "Poisson en papillote de feuilles de bananier"},
                {"name": "Ntaba na Mbisi", "desc": "Viande de chèvre mijotée"}
            ],
            "highlights": ["Cuisson en papillote", "Version légère", "Feuilles de manioc"],
            "nutritional_info": {"proteins": 40, "carbs": 44, "fats": 16, "fiber": 16},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        {
            "id": "box-mikate-maboke",
            "name": "BOX MIKATE & MABOKE — Douceurs Congolaises",
            "description": "Entre plats salés et douceurs traditionnelles. Poissons du fleuve Congo.",
            "price": 58.00,
            "image_url": "https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=85",
            "category": "decouverte",
            "country": "congo",
            "country_flag": "🇨🇩",
            "serves": 2,
            "prep_time": 55,
            "calories": 440,
            "ingredients": ["Capitaine", "Feuilles Fumbwa", "Arachides", "Poisson salé", "Tomates", "Farine", "Riz", "Haricots"],
            "recipe_steps": ["Farcir et cuire le Maboke", "Préparer le Fumbwa sauce arachide", "Cuisiner le Makayabu", "Préparer les Mikate légers"],
            "dishes": [
                {"name": "Maboke", "desc": "Capitaine farci cuit en feuilles"},
                {"name": "Fumbwa", "desc": "Feuilles sauvages sauce arachide"},
                {"name": "Makayabu", "desc": "Poisson salé séché en sauce tomate"},
                {"name": "Mikate", "desc": "Beignets sucrés congolais (version légère)"}
            ],
            "highlights": ["Poissons du fleuve Congo", "Douceurs traditionnelles", "Version légère"],
            "nutritional_info": {"proteins": 36, "carbs": 52, "fats": 18, "fiber": 10},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": False
        },
        # === SÉNÉGAL ===
        {
            "id": "box-thieboudienne-yassa",
            "name": "BOX THIÉBOUDIENNE & YASSA — Classiques UNESCO",
            "description": "Le Thiéboudienne est inscrit au patrimoine UNESCO ! Recettes UNESCO revisitées healthy.",
            "price": 63.00,
            "image_url": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800&q=85",
            "category": "signature",
            "country": "senegal",
            "country_flag": "🇸🇳",
            "serves": 2,
            "prep_time": 65,
            "calories": 460,
            "ingredients": ["Nététou (soumbala)", "Yet (escargot de mer séché)", "Tamarin", "Riz brisé", "Poisson thiof", "Poulet", "Citrons", "Oignons", "Arachides"],
            "recipe_steps": ["Préparer le Thiéboudienne", "Mariner et cuire le Yassa", "Cuisiner le Mafé", "Préparer le Thiou léger"],
            "dishes": [
                {"name": "Thiéboudienne", "desc": "Riz au poisson, légumes farcis, sauce tomate"},
                {"name": "Yassa Poulet", "desc": "Poulet mariné citron-oignon-moutarde"},
                {"name": "Mafé", "desc": "Viande en sauce d'arachide onctueuse"},
                {"name": "Thiou", "desc": "Ragoût léger de viande aux légumes"}
            ],
            "highlights": ["Patrimoine UNESCO", "Recettes revisitées healthy", "Classiques sénégalais"],
            "nutritional_info": {"proteins": 42, "carbs": 52, "fats": 18, "fiber": 12},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        },
        # === MULTI-PAYS ===
        {
            "id": "box-tour-afrique-centrale",
            "name": "BOX TOUR D'AFRIQUE CENTRALE",
            "description": "Un voyage culinaire à travers 5 pays d'Afrique Centrale et de l'Ouest. 5 recettes emblématiques.",
            "price": 75.00,
            "image_url": "https://images.unsplash.com/photo-1567364816519-cbc8c6a73615?w=800&q=85",
            "category": "multi-pays",
            "country": "multi",
            "country_flag": "🌍",
            "serves": 2,
            "prep_time": 90,
            "calories": 440,
            "ingredients": ["Ingrédients Nyembwe (Gabon)", "Feuilles de Ndolé (Cameroun)", "Attiéké (Côte d'Ivoire)", "Feuilles de bananier (Congo)", "Riz brisé (Sénégal)"],
            "recipe_steps": ["Préparer le Poulet Nyembwe", "Cuisiner le Ndolé aux crevettes", "Faire le Kédjénou", "Préparer le Liboke", "Finaliser le Thiéboudienne"],
            "dishes": [
                {"name": "Poulet Nyembwe", "desc": "🇬🇦 Gabon"},
                {"name": "Ndolé aux crevettes", "desc": "🇨🇲 Cameroun"},
                {"name": "Kédjénou de poulet", "desc": "🇨🇮 Côte d'Ivoire"},
                {"name": "Liboke de poisson", "desc": "🇨🇩 Congo"},
                {"name": "Thiéboudienne", "desc": "🇸🇳 Sénégal"}
            ],
            "highlights": ["5 pays", "5 recettes emblématiques", "Voyage culinaire complet"],
            "nutritional_info": {"proteins": 40, "carbs": 48, "fats": 18, "fiber": 14},
            "is_vegetarian": False,
            "is_vegan": False,
            "is_gluten_free": True
        }
    ]
    
    recipes = [
        {
            "id": "recipe-thieboudienne",
            "title": "Thiéboudienne — Le Roi UNESCO",
            "description": "Le plat national sénégalais inscrit au patrimoine UNESCO. Riz au poisson parfumé aux légumes farcis.",
            "image_url": "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=85",
            "country": "senegal",
            "author": "Chef Fatou Diallo",
            "prep_time": 30,
            "cook_time": 60,
            "serves": 4,
            "difficulty": "Intermédiaire",
            "ingredients": ["500g de poisson thiof", "400g de riz brisé", "Chou", "Carottes", "Aubergine", "Concentré de tomate", "Nététou", "Yet"],
            "instructions": ["Farcir le poisson au persil-ail", "Préparer la sauce tomate épicée", "Cuire les légumes", "Cuire le riz dans le bouillon", "Dresser avec le poisson"],
            "tips": "Le secret: cuire le riz dans le bouillon de poisson pour absorber toutes les saveurs."
        },
        {
            "id": "recipe-ndole",
            "title": "Ndolé — Le Plat National Camerounais",
            "description": "Feuilles amères aux crevettes et arachides. Un plat détox et savoureux.",
            "image_url": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=85",
            "country": "cameroun",
            "author": "Chef Marie Ngo",
            "prep_time": 40,
            "cook_time": 50,
            "serves": 4,
            "difficulty": "Avancé",
            "ingredients": ["Feuilles de Ndolé", "Crevettes fraîches", "Pâte d'arachide", "Njansang", "Bœuf", "Poisson fumé"],
            "instructions": ["Blanchir les feuilles 3 fois", "Préparer la pâte d'arachide", "Faire revenir les crevettes", "Mijoter ensemble", "Servir avec miondo"],
            "tips": "Blanchir les feuilles plusieurs fois retire l'amertume excessive."
        },
        {
            "id": "recipe-poulet-nyembwe",
            "title": "Poulet Nyembwe — L'Or du Gabon",
            "description": "Poulet mijoté dans la sauce de noix de palme. Version allégée mais authentique.",
            "image_url": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&q=85",
            "country": "gabon",
            "author": "Chef Pamela Obame",
            "prep_time": 25,
            "cook_time": 45,
            "serves": 4,
            "difficulty": "Intermédiaire",
            "ingredients": ["Poulet fermier", "Pâte de nyembwe", "Odika", "Piment", "Oignons", "Ail"],
            "instructions": ["Faire dorer le poulet", "Préparer la sauce nyembwe", "Mijoter le poulet dans la sauce", "Ajouter l'odika", "Servir avec bâtons de manioc"],
            "tips": "Utiliser une version allégée de la pâte de palme pour réduire les graisses."
        },
        {
            "id": "recipe-kedjenou",
            "title": "Kédjénou — Poulet Zéro Matière Grasse",
            "description": "Le secret ivoirien: poulet cuit en cocotte fermée sans eau ni huile!",
            "image_url": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&q=85",
            "country": "cote-ivoire",
            "author": "Chef Adjoua Kouassi",
            "prep_time": 15,
            "cook_time": 60,
            "serves": 4,
            "difficulty": "Facile",
            "ingredients": ["Poulet entier découpé", "Tomates", "Oignons", "Piment", "Gingembre", "Ail", "Laurier"],
            "instructions": ["Découper et assaisonner le poulet", "Mettre dans une cocotte hermétique", "NE PAS OUVRIR pendant la cuisson", "Cuire 1h à feu doux", "Servir avec attiéké"],
            "tips": "Le secret: ne JAMAIS ouvrir la cocotte pendant la cuisson!"
        },
        {
            "id": "recipe-liboke",
            "title": "Liboke — Poisson en Papillote Congolaise",
            "description": "Poisson farci cuit dans des feuilles de bananier. La cuisson la plus saine!",
            "image_url": "https://images.unsplash.com/photo-1574484284002-952d92456975?w=800&q=85",
            "country": "congo",
            "author": "Chef Maman Ngoma",
            "prep_time": 20,
            "cook_time": 40,
            "serves": 4,
            "difficulty": "Facile",
            "ingredients": ["Poisson capitaine", "Feuilles de bananier", "Tomates", "Oignons", "Piment", "Huile de palme"],
            "instructions": ["Nettoyer et farcir le poisson", "Envelopper dans les feuilles", "Cuire à la vapeur ou braise", "Servir dans la papillote"],
            "tips": "Les feuilles de bananier parfument délicatement le poisson."
        }
    ]
    
    await db.boxes.insert_many(boxes)
    await db.recipes.insert_many(recipes)
    
    return {"message": "Data seeded successfully", "boxes": len(boxes), "recipes": len(recipes)}

# ==================== ROOT ====================

# ==================== STRIPE / PAIEMENT ====================

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

# ==================== EMAIL (RESEND) ====================

RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL = os.environ.get("FROM_EMAIL", "noreply@okoumebox.fr")

async def send_order_confirmation_email(user_email: str, user_name: str, order: dict):
    """Envoie un email de confirmation de commande via Resend."""
    if not RESEND_API_KEY:
        logger.info("RESEND_API_KEY non configuré — email non envoyé (mode dev)")
        return

    items_html = "".join([
        f"<tr><td style='padding:8px;border-bottom:1px solid #f3f4f6'>{item['name']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #f3f4f6;text-align:center'>{item['quantity']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #f3f4f6;text-align:right'>{item['price']:.2f} €</td></tr>"
        for item in order.get("items", [])
    ])

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family:Inter,sans-serif;background:#fafaf9;margin:0;padding:20px">
      <div style="max-width:560px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <div style="background:#D94B13;padding:32px 40px;text-align:center">
          <h1 style="color:white;margin:0;font-size:22px">🌍 Okoumé Box</h1>
          <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:14px">Box culinaires africaines</p>
        </div>
        <div style="padding:32px 40px">
          <h2 style="color:#1c1917;margin:0 0 8px">Commande confirmée ✅</h2>
          <p style="color:#78716c;margin:0 0 24px">Bonjour {user_name}, votre commande a bien été reçue !</p>

          <div style="background:#fff7ed;border-radius:12px;padding:16px;margin-bottom:24px">
            <p style="margin:0;font-size:13px;color:#9a3412"><strong>N° de commande :</strong> #{order['id'][:8].upper()}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#9a3412"><strong>Livraison prévue :</strong> {order.get('delivery_date', '—')}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#9a3412"><strong>Adresse :</strong> {order.get('delivery_address', '—')}</p>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <thead>
              <tr style="background:#f9fafb">
                <th style="padding:8px;text-align:left;font-size:12px;color:#6b7280">Article</th>
                <th style="padding:8px;text-align:center;font-size:12px;color:#6b7280">Qté</th>
                <th style="padding:8px;text-align:right;font-size:12px;color:#6b7280">Prix</th>
              </tr>
            </thead>
            <tbody>{items_html}</tbody>
          </table>

          <div style="text-align:right;border-top:2px solid #f3f4f6;padding-top:12px">
            <p style="margin:0;font-size:18px;font-weight:bold;color:#D94B13">Total : {order['total']:.2f} €</p>
          </div>

          <div style="margin-top:32px;text-align:center">
            <a href="http://localhost:3000/profile" style="background:#D94B13;color:white;padding:12px 28px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:600">
              Suivre ma commande
            </a>
          </div>
        </div>
        <div style="background:#f9fafb;padding:20px 40px;text-align:center">
          <p style="margin:0;font-size:12px;color:#9ca3af">© 2026 Okoumé Box — contact@okoumebox.fr</p>
        </div>
      </div>
    </body>
    </html>
    """

    try:
        import httpx
        async with httpx.AsyncClient() as client_http:
            response = await client_http.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
                json={
                    "from": f"Okoumé Box <{FROM_EMAIL}>",
                    "to": [user_email],
                    "subject": f"✅ Commande #{order['id'][:8].upper()} confirmée — Okoumé Box",
                    "html": html_body,
                },
                timeout=10.0,
            )
            if response.status_code not in (200, 201):
                logger.error(f"Resend API error: {response.text}")
            else:
                logger.info(f"Email envoyé à {user_email}")
    except Exception as e:
        logger.error(f"Erreur envoi email: {e}")

class PaymentIntentCreate(BaseModel):
    delivery_address: str
    delivery_date: str
    phone: str

class PaymentConfirm(BaseModel):
    order_id: str
    payment_intent_id: str

@api_router.post("/payments/create-intent")
async def create_payment_intent(data: PaymentIntentCreate, user=Depends(get_current_user)):
    # Récupérer le panier
    cart = await db.carts.find_one({"user_id": user["id"]})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Panier vide")

    items = []
    total = 0
    for item in cart["items"]:
        box = await db.boxes.find_one({"id": item["box_id"]}, {"_id": 0})
        if box:
            cart_item = {"box_id": box["id"], "name": box["name"], "price": box["price"],
                         "quantity": item["quantity"], "image_url": box["image_url"]}
            items.append(cart_item)
            total += box["price"] * item["quantity"]

    # Créer la commande en statut "pending_payment"
    order_id = str(uuid.uuid4())
    order_doc = {
        "id": order_id,
        "user_id": user["id"],
        "items": items,
        "total": round(total, 2),
        "status": "pending_payment",
        "delivery_address": data.delivery_address,
        "delivery_date": data.delivery_date,
        "phone": data.phone,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.insert_one(order_doc)

    # Si Stripe est configuré, créer un PaymentIntent réel
    client_secret = None
    if STRIPE_SECRET_KEY:
        try:
            import stripe
            stripe.api_key = STRIPE_SECRET_KEY
            intent = stripe.PaymentIntent.create(
                amount=int(total * 100),  # en centimes
                currency="eur",
                metadata={"order_id": order_id, "user_id": user["id"]},
            )
            client_secret = intent.client_secret
            await db.orders.update_one({"id": order_id}, {"$set": {"stripe_payment_intent": intent.id}})
        except Exception as e:
            logger.warning(f"Stripe error: {e} — mode simulation activé")

    return {"order_id": order_id, "client_secret": client_secret, "total": round(total, 2)}

@api_router.post("/payments/confirm")
async def confirm_payment(data: PaymentConfirm, user=Depends(get_current_user)):
    order = await db.orders.find_one({"id": data.order_id, "user_id": user["id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")

    # Vérifier avec Stripe si configuré
    if STRIPE_SECRET_KEY and not data.payment_intent_id.startswith("pi_simulated"):
        try:
            import stripe
            stripe.api_key = STRIPE_SECRET_KEY
            intent = stripe.PaymentIntent.retrieve(data.payment_intent_id)
            if intent.status != "succeeded":
                raise HTTPException(status_code=400, detail="Paiement non confirmé par Stripe")
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=400, detail=str(e))

    # Valider la commande
    await db.orders.update_one(
        {"id": data.order_id},
        {"$set": {"status": "confirmed", "payment_intent_id": data.payment_intent_id}}
    )
    await db.carts.delete_one({"user_id": user["id"]})

    updated_order = await db.orders.find_one({"id": data.order_id}, {"_id": 0, "phone": 0})

    # Envoyer l'email de confirmation
    try:
        await send_order_confirmation_email(user["email"], user["name"], updated_order)
    except Exception as e:
        logger.error(f"Email error (non bloquant): {e}")

    return updated_order

# ==================== ADMIN HELPERS ====================

async def get_admin_user(user=Depends(get_current_user)):
    if not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return user

# ==================== ADMIN ROUTES ====================

@api_router.post("/admin/setup")
async def setup_first_admin(user=Depends(get_current_user)):
    """Permet au premier utilisateur connecté de devenir admin (seulement si aucun admin n'existe)."""
    existing_admin = await db.users.find_one({"is_admin": True})
    if existing_admin:
        raise HTTPException(status_code=400, detail="Un administrateur existe déjà")
    await db.users.update_one({"id": user["id"]}, {"$set": {"is_admin": True}})
    return {"message": f"{user['name']} est maintenant administrateur"}

@api_router.get("/admin/stats")
async def get_admin_stats(admin=Depends(get_admin_user)):
    users_count = await db.users.count_documents({})
    orders_count = await db.orders.count_documents({})
    boxes_count = await db.boxes.count_documents({})
    subscriptions_count = await db.subscriptions.count_documents({"status": "active"})

    # Total revenue from orders
    orders = await db.orders.find({}, {"total": 1}).to_list(1000)
    total_revenue = sum(o.get("total", 0) for o in orders)

    # Recent orders (last 5)
    recent_orders = await db.orders.find({}, {"_id": 0, "phone": 0}).sort("created_at", -1).to_list(5)

    # Orders by status
    pending = await db.orders.count_documents({"status": "pending"})
    confirmed = await db.orders.count_documents({"status": "confirmed"})
    delivered = await db.orders.count_documents({"status": "delivered"})
    cancelled = await db.orders.count_documents({"status": "cancelled"})

    return {
        "users_count": users_count,
        "orders_count": orders_count,
        "boxes_count": boxes_count,
        "subscriptions_count": subscriptions_count,
        "total_revenue": round(total_revenue, 2),
        "recent_orders": recent_orders,
        "orders_by_status": {
            "pending": pending,
            "confirmed": confirmed,
            "delivered": delivered,
            "cancelled": cancelled
        }
    }

@api_router.get("/admin/users")
async def get_all_users(admin=Depends(get_admin_user)):
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(500)
    # Add order count per user
    result = []
    for u in users:
        order_count = await db.orders.count_documents({"user_id": u["id"]})
        u["order_count"] = order_count
        result.append(u)
    return result

@api_router.get("/admin/orders")
async def get_all_orders(admin=Depends(get_admin_user), status: Optional[str] = None):
    query = {}
    if status:
        query["status"] = status
    orders = await db.orders.find(query, {"_id": 0, "phone": 0}).sort("created_at", -1).to_list(200)
    # Enrich with user name
    for order in orders:
        user = await db.users.find_one({"id": order["user_id"]}, {"name": 1, "email": 1, "_id": 0})
        if user:
            order["user_name"] = user.get("name", "")
            order["user_email"] = user.get("email", "")
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str, admin=Depends(get_admin_user)):
    valid_statuses = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Statut invalide. Valeurs: {valid_statuses}")
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return {"message": f"Statut mis à jour : {status}"}

@api_router.put("/admin/users/{user_id}/toggle-admin")
async def toggle_admin(user_id: str, admin=Depends(get_admin_user)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    new_status = not user.get("is_admin", False)
    await db.users.update_one({"id": user_id}, {"$set": {"is_admin": new_status}})
    return {"message": f"Admin: {new_status}", "is_admin": new_status}

@api_router.get("/auth/me")
async def get_me_admin(user=Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "created_at": user["created_at"],
        "is_admin": user.get("is_admin", False)
    }

@api_router.get("/")
async def root():
    return {"message": "Bienvenue sur l'API Okoumé Box!", "version": "1.0.0"}

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
