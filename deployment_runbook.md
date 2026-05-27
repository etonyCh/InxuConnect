# Guide de Déploiement Production (Runbook) & Stratégies de Rollback

Ce document est le guide de référence opérationnel pour le déploiement et la maintenance en production d'InzuConnect.

---

## 1. Prérequis d'Infrastructure

Avant tout déploiement en production, s'assurer que les services suivants sont provisionnés sur la région AWS Le Cap (**af-south-1**) :
1. **Base de données** : AWS RDS PostgreSQL 16 avec extension PostGIS activée.
2. **Cache & Queues** : Cluster Redis (ex: ElastiCache ou Upstash) accessible par l'API.
3. **Stockage Media** : Bucket Cloudflare R2 configuré et accessible avec identifiants S3.
4. **Secrets / Config** : Variables d'environnement configurées dans le gestionnaire de secrets (AWS Secrets Manager ou variables CI/CD).

---

## 2. Variables d'Environnement Requises

### Pour l'API Backend (Fastify)
| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret de signature des tokens API | `inzuconnect-jwt-prod-secret-...` |
| `REDIS_URL` | URL du serveur Redis | `redis://default:pass@redis-host:6379` |
| `CLAUDE_API_KEY` | Clé API d'Anthropic Claude | `sk-ant-sid01-...` |
| `INTOUCH_API_KEY` | Clé API agrégateur mobile money | `it_key_...` |
| `INTOUCH_API_URL` | URL de l'API de paiement InTouch | `https://api.intouchgroup.net` |
| `SMS_API_KEY` | Clé d'envoi SMS (Africa's Talking) | `at_key_...` |

### Pour le Web Frontend (Next.js)
| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `NEXTAUTH_SECRET` | Secret pour NextAuth.js | `nextauth-prod-secret-...` |
| `NEXTAUTH_URL` | URL canonique du site web | `https://inzuconnect.com` |
| `NEXT_PUBLIC_API_URL` | URL de l'API Backend publique | `https://api.inzuconnect.com` |

---

## 3. Guide de Déploiement Pas-à-Pas (Rolling Update)

### Étape 1 : Build & Push des images Docker
Compiler et envoyer les conteneurs d'API et du Web sur le registre d'images (AWS ECR) :
```bash
# Build de l'API
docker build -t inzuconnect-api:latest -f apps/api/Dockerfile .
docker tag inzuconnect-api:latest <aws_account_id>.dkr.ecr.af-south-1.amazonaws.com/inzuconnect-api:<git_commit_sha>
docker push <aws_account_id>.dkr.ecr.af-south-1.amazonaws.com/inzuconnect-api:<git_commit_sha>

# Build du Frontend Web
docker build -t inzuconnect-web:latest -f apps/web/Dockerfile .
docker tag inzuconnect-web:latest <aws_account_id>.dkr.ecr.af-south-1.amazonaws.com/inzuconnect-web:<git_commit_sha>
docker push <aws_account_id>.dkr.ecr.af-south-1.amazonaws.com/inzuconnect-web:<git_commit_sha>
```

### Étape 2 : Application des migrations de base de données
Appliquer les nouvelles migrations Prisma de manière isolée avant de démarrer les nouveaux conteneurs :
```bash
docker run --rm \
  -e DATABASE_URL=$DATABASE_URL \
  <aws_account_id>.dkr.ecr.af-south-1.amazonaws.com/inzuconnect-api:<git_commit_sha> \
  npx prisma migrate deploy
```

### Étape 3 : Déploiement des conteneurs (Rolling Update)
Mettre à jour les services sur le cluster ECS/K8s pour remplacer progressivement les anciennes instances :
```bash
# Force le déploiement sur ECS
aws ecs update-service --cluster inzuconnect-prod --service api-service --force-new-deployment
aws ecs update-service --cluster inzuconnect-prod --service web-service --force-new-deployment
```

### Étape 4 : Validation (Smoke Tests)
Lancer le workflow de tests de fumée pour s'assurer que les services répondent correctement en production.

---

## 4. Plan de Rollback (Retour Arrière en cas de panne)

Si les Smoke Tests échouent ou si des erreurs critiques apparaissent après le déploiement, appliquez immédiatement les actions suivantes :

### A. Rollback des Services Web et API (Downtime < 10s)
Réactiver immédiatement la version précédente stable des images Docker :
```bash
# Déploiement forcé de la version stable N-1
aws ecs update-service --cluster inzuconnect-prod --service api-service --task-definition api-service:previous_stable_revision
aws ecs update-service --cluster inzuconnect-prod --service web-service --task-definition web-service:previous_stable_revision
```

### B. Rollback de la Base de Données (Prisma)
> [!CAUTION]
> Un retour arrière de base de données peut entraîner des pertes de données si de nouveaux enregistrements ont été créés pendant le laps de temps du déploiement défaillant.

1. **Si la migration est rétrocompatible** (ex : simple ajout de colonne ou de table non contraignante) :
   - Conserver la base de données en l'état. Aucune action de migration inverse n'est requise.
2. **Si la migration est bloquante / destructrice** :
   - Restaurer l'instantané (RDS Snapshot) pris automatiquement avant l'application de l'étape 2.
   - Commande de restauration RDS :
     ```bash
     aws rds restore-db-instance-to-point-in-time \
       --source-db-instance-identifier inzuconnect-db-prod \
       --target-db-instance-identifier inzuconnect-db-prod-rollback \
       --restore-time <date_pre_deploiement>
     ```
