# AfroBox - PRD (Product Requirements Document)

## Original Problem Statement
Créer un site comme HelloFresh/Quitoque pour des box alimentaires africaines équilibrées et saines. Les clients peuvent personnaliser leurs plats via un chat IA selon leur poids, taille, régime alimentaire, allergies.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI + MongoDB
- **IA**: OpenAI GPT-5.2 via Emergent LLM Key
- **Auth**: JWT

## User Personas
1. **Diaspora africaine** - Nostalgique des saveurs d'origine
2. **Foodies curieux** - Découvrir nouvelles cuisines
3. **Personnes santé-conscious** - Alimentation équilibrée

## Core Requirements (Static)
- ✅ Catalogue de box par catégorie et région
- ✅ Détail box avec recette et ingrédients
- ✅ Blog recettes africaines
- ✅ Chat IA personnalisation nutritionnelle
- ✅ Système panier et commande
- ✅ Authentification utilisateur

## What's Been Implemented (Feb 2, 2026)
### Pages
- HomePage avec hero, features, boxes populaires
- CataloguePage avec filtres catégorie/région
- BoxDetailPage avec ingrédients, recette, valeurs nutritionnelles
- BlogPage avec recettes africaines
- BlogArticlePage avec détail recette
- AuthPage (connexion/inscription)
- CartPage avec checkout
- ProfilePage avec historique commandes

### Backend APIs
- Auth: register, login, me
- Boxes: list, detail, featured
- Recipes: list, detail
- Cart: get, add, update, remove
- Orders: create, list
- Chat: AI conversation (GPT-5.2)
- Seed: initial data

### Data
- 6 boxes (Jollof, Tagine, Yassa, Mafé, Injera, Bobotie)
- 4 recettes (Thiéboudienne, Couscous, Doro Wat, Chakalaka)
- 4 régions (Nord, Sud, Est, Ouest)

## Prioritized Backlog
### P0 (Critical)
- ✅ All features implemented

### P1 (High)
- [ ] Stripe payment integration
- [ ] Email confirmation commandes
- [ ] Admin dashboard

### P2 (Medium)
- [ ] Avis utilisateurs sur les box
- [ ] Programme fidélité
- [ ] Abonnement mensuel

## Next Tasks
1. Intégrer Stripe pour paiements réels
2. Envoyer emails de confirmation (Resend/SendGrid)
3. Dashboard admin pour gérer box et commandes
4. Système d'avis et notes
