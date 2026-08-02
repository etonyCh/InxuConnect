# InzuConnect 🇧🇮

**InzuConnect** est la première plateforme d'hébergement et de séjours spécialement conçue pour le marché du Burundi. Inspirée des standards d'Airbnb et adaptée aux réalités socio-économiques locales (*Franc Burundais FBU, Mobile Money Lumicash/EcoCash, Cartographie OpenStreetMap, Bilinguisme Français/Kirundi, Programme d'Affiliation Agents*).

---

## 🎨 Charte Graphique & UI Premium
- **Couleur Primaire (Violet Inzu)** : `#36255C`
- **Couleur Secondaire (Lavande)** : `#D2C3F6`
- **Interface UI/UX** : Inspirée d'Airbnb (Pill search bar, carousel de photos, badges d'hôtes vérifiés, sélecteur de dates, décomposition détaillée du tarif FBU).

---

## 🚀 Fonctionnalités Clés Burundi

- **💳 Séquestre Mobile Money (Lumicash & EcoCash)** : Blocage sécurisé des acomptes en FBU avec libération automatique vers l'Hôte 24h après le Check-in.
- **🤝 Programme d'Affiliation Agents (3% FBU)** : Calcul automatique de 3% de commission pour les agents communautaires parrains dans les provinces (*Bujumbura, Gitega, Ngozi, Bururi*).
- **📅 Sélecteur de Dates & Décomposition Tarif FBU** : Calcul dynamique du séjour (*Prix base × N nuits + Frais de ménage 15 000 FBU + Frais service 5% + Option Épargne Communautaire*).
- **🎛️ Filtres d'Infrastructures Burundi** : Groupe Électrogène, Citerne d'eau, Énergie Solaire, Vue Lac, Climatisation.
- **💬 Messagerie Temps Réel Hôte ↔ Voyageur** : WebSockets STOMP (`/ws-chat`) pour échanger en direct avant et après réservation.
- **📱 PWA & Mode Mobile Simulator** : Basculeur intégré Vue Web / Vue Mobile Smartphone et manifeste PWA (`manifest.json`) pour installation sur Android/iOS.
- **📲 Notifications SMS (+257 Burundi)** : Alertes SMS automatiques pour les réservations et validations de comptes.
- **🛡️ Validation Identité KYC Admin** : Soumission de CNI / Passeport et Selfie pour l'obtention du badge `VÉRIFIÉ`.

---

## 🛠️ Stack Technique

InzuConnect est un monorepo architecturé avec **Turborepo** :

- **Frontend (Web & PWA)** : **Angular 18** (Standalone Components, RxJS, PWA Manifest, Leaflet OpenStreetMap).
- **Backend (API)** : **Java 21**, **Spring Boot 3**, Spring Security (CORS & WebSockets STOMP), Hibernate/JPA Specification.
- **Base de Données** : PostgreSQL 16.

---

## ⚙️ Démarrage Rapide

### 1. Démarrer le Backend (Spring Boot 3)
```bash
cd apps/java-api
mvn spring-boot:run
```
*(L'API écoute sur `http://localhost:8080`)*

### 2. Démarrer le Frontend (Angular 18)
```bash
cd apps/web
pnpm dev
```
*(Le site web et la PWA sont accessibles sur `http://localhost:4200`)*

### 3. Compilation & Build Production
```bash
# Backend Spring Boot
cd apps/java-api && mvn compile

# Frontend Angular 18
cd apps/web && npx ng build
```

---

## 🛡️ Licence
Projet InzuConnect Burundi - Tous droits réservés.
