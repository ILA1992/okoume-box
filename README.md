# Okoume Box

## Présentation
Okoume Box est une application Franco-Africaine pour commander des box culinaires africaines saines, découvrir des recettes et personnaliser ses choix avec une IA nutritionniste.

## Architecture
- `backend/` : API FastAPI avec MongoDB, authentification JWT et gestion des boxes, panier, commandes, chat et abonnements.
- `frontend/` : application React Create React App avec routing, pages catalogue, box, blog, panier, profil et abonnement.

## Configuration

### Backend
Créer un fichier `backend/.env` à partir du fichier exemple :

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=okoume_box
JWT_SECRET=afrobox-secret-key
CORS_ORIGINS=http://localhost:3000
EMERGENT_LLM_KEY=
```

### Frontend
Créer un fichier `frontend/.env` à partir du fichier exemple :

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Démarrage

### Backend
Installer les dépendances et lancer le serveur :

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
Installer les dépendances et lancer l'application :

```bash
cd frontend
yarn install
yarn start
```

## Notes
- Le backend propose un endpoint de seed : `POST /api/seed`.
- Le frontend utilise `REACT_APP_BACKEND_URL` pour appeler l'API.
- Le composant `BoxCard` est maintenant utilisé dans la page `CataloguePage`.
