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

InzuConnect est un monorepo architecturé avec **Turborepo** contenant :

- **Frontend (Web)** : Next.js 14+ (App Router), React, Tailwind CSS, Leaflet (Cartographie), NextAuth (Authentification).
- **Frontend (Mobile)** : React Native avec Expo, Navigation native, expo-secure-store.
- **Backend (API)** : Java 21, Spring Boot 3, Spring Security (JWT), Hibernate/JPA.
- **Base de Données** : PostgreSQL 16 (conteneurisée via Docker).
- **Tests Automatisés** : Playwright (End-to-End).
- **Monitoring** : Sentry (Web & Mobile).

## ⚙️ Installation & Lancement

### Prérequis
- Java 21 (JDK) & Maven
- Node.js (v18+) & pnpm
- Docker & Docker Compose

### 1. Cloner et Installer
```bash
git clone https://github.com/etonyCh/InxuConnect.git
cd InxuConnect
pnpm install
```

### 2. Démarrer la Base de Données (PostgreSQL)
L'infrastructure locale est gérée via Docker Compose.
```bash
docker-compose up -d postgres
```

### 3. Démarrer le Backend (Spring Boot)
L'API écoutera sur le port `8080`.
```bash
cd apps/java-api
mvn spring-boot:run
```
*(Note: Hibernate se chargera de créer et de mettre à jour le schéma de la base de données automatiquement).*

### 4. Démarrer le Frontend (Next.js)
Dans un nouveau terminal, depuis la racine du projet :
```bash
pnpm --filter web dev
```
- Le site web sera accessible sur `http://localhost:3000`

### 5. Tests E2E (Playwright)
Pour lancer les tests automatisés avec interface graphique :
```bash
npx playwright test --ui
```

## 🛡️ License

Projet privé. Tous droits réservés.
