# InzuConnect 🇧🇮

**InzuConnect** est la première plateforme immobilière moderne et sécurisée spécialement conçue pour le marché du Burundi. Elle connecte facilement les voyageurs, les propriétaires, les agents communautaires et les entreprises.

## 🚀 Fonctionnalités Principales

- **Multi-Rôles (RBAC)** :
  - **Voyageur (Guest)** : Recherche de logements avec carte interactive (Leaflet), gestion de séjours, accès à l'espace B2B.
  - **Hôte (Host)** : Ajout de propriétés, gestion des réservations, tableau de bord financier.
  - **Agent Communautaire (Agent)** : Système de parrainage (affiliation) avec suivi des filleuls et des commissions générées.
  - **Administrateur (Admin)** : Tour de contrôle globale, gestion des utilisateurs, validation des identités (KYC) et statistiques de la plateforme.
- **Sécurité & Confiance (KYC)** : Vérification d'identité via CNI et selfie, contrôlée manuellement par les administrateurs pour octroyer un badge `VERIFIED`.
- **Cartographie** : Localisation précise des propriétés au Burundi grâce à OpenStreetMap.
- **B2B** : Espace dédié aux entreprises et ONG pour gérer les séjours professionnels.

## 🛠️ Stack Technique

InzuConnect est un monorepo Turborepo contenant :

- **Frontend (Web)** : Next.js 14+ (App Router), React, Tailwind CSS, Leaflet (Cartographie), NextAuth (Authentification).
- **Backend (API)** : Fastify, Prisma ORM, PostgreSQL.

## ⚙️ Installation & Lancement

### Prérequis
- Node.js (v18+)
- PostgreSQL en cours d'exécution

### 1. Cloner et Installer
```bash
git clone https://github.com/etonyCh/InxuConnect.git
cd InxuConnect
npm install
```

### 2. Configuration Environnement
Créez un fichier `.env` à la racine (ou dans `apps/api/` selon votre configuration) avec au minimum :
```env
DATABASE_URL="postgresql://user:password@localhost:5432/inzuconnect"
NEXTAUTH_SECRET="votre-secret-complexe"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Base de Données
Initialisez la base de données et générez les données de démo :
```bash
cd apps/api
npx prisma db push
npx prisma db seed
```
> *Comptes par défaut (mot de passe : `demo123`) : guest@inzu.bi, host@inzu.bi, agent@inzu.bi, admin@inzu.bi*

### 4. Démarrer l'application
Depuis la racine du projet :
```bash
npm run dev
```
- Le frontend sera accessible sur `http://localhost:3000`
- L'API backend sera accessible sur `http://localhost:3001`

## 🛡️ License

Projet privé. Tous droits réservés.
