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
    # Clear existing data and reseed
    await db.boxes.delete_many({})
    await db.recipes.delete_many({})
    
    boxes = [
        # === GABON ===
        {
            "id": "box-nyembwe",
            "name": "BOX NYEMBWE — L'Or du Gabon",
            "description": "Le Nyembwe est la sauce emblématique à base de noix de palme. Version allégée -40% d'huile de palme, cuisson vapeur.",
            "price": 65.00,
            "image_url": "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1574484284002-952d92456975?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1651718543197-f567aeaa4fb0?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800",
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
            "image_url": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800",
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
