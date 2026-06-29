# 🚀 Guide de démarrage — Okoumé Box

## 1. Lancer l'application en local

### Frontend (site web)
Double-clique sur le fichier : `start-frontend.bat`
→ Le site s'ouvre automatiquement sur http://localhost:3000

### Backend (serveur API)
Double-clique sur le fichier : `start-backend.bat`
→ L'API tourne sur http://localhost:8000

**Les deux doivent tourner en même temps pour que le site soit complet.**

---

## 2. Devenir administrateur

1. Ouvre le site → Va sur http://localhost:3000/auth
2. Crée un compte (ou connecte-toi)
3. Ouvre un nouvel onglet et va sur :
   http://localhost:3000 (reste connecté)
4. Dans la barre d'adresse du navigateur, va sur :
   http://localhost:8000/api/admin/setup
   → Tu verras : {"message":"[ton nom] est maintenant administrateur"}
5. Recharge le site → Un lien "Dashboard Admin" apparaît dans ton menu

---

## 3. Stripe (paiements réels)

### Créer un compte gratuit
1. Va sur https://stripe.com et crée un compte
2. Dans le tableau de bord Stripe → "Développeurs" → "Clés API"
3. Copie ta clé **Secrète** (commence par `sk_test_...`)

### Ajouter la clé dans le projet
1. Ouvre le fichier : `okoume-box/backend/.env`
2. Ajoute la ligne : `STRIPE_SECRET_KEY=sk_test_TA_CLE_ICI`
3. Relance le backend

**Sans cette clé, les paiements fonctionnent quand même en mode simulation (pour les tests).**

---

## 4. Resend (emails de confirmation)

### Créer un compte gratuit
1. Va sur https://resend.com et crée un compte
2. "API Keys" → "Create API Key"
3. Copie la clé (commence par `re_...`)

### Ajouter la clé dans le projet
1. Ouvre le fichier : `okoume-box/backend/.env`
2. Ajoute la ligne : `RESEND_API_KEY=re_TA_CLE_ICI`
3. Relance le backend

**Sans cette clé, les emails sont juste enregistrés dans les logs (pas envoyés).**

---

## 5. Mettre en ligne (optionnel)

Pour que ton site soit accessible depuis internet :

### Frontend → Vercel (gratuit)
1. Va sur https://vercel.com, connecte-toi avec GitHub
2. "New Project" → importe le dossier `frontend`
3. Ton site aura une URL comme : https://okoume-box.vercel.app

### Backend → Railway (gratuit)
1. Va sur https://railway.app
2. "New Project" → importe le dossier `backend`
3. Ajoute tes variables d'environnement dans Railway

---

## Résumé des fichiers importants

| Fichier | Rôle |
|---------|------|
| `start-frontend.bat` | Lance le site web |
| `start-backend.bat` | Lance le serveur API |
| `backend/.env` | Tes clés secrètes (Stripe, Resend...) |
| `frontend/.env` | URL du backend |
