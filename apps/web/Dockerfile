# STAGE 1: Build stage - Context = repo root (pnpm workspace)
FROM node:20-alpine AS builder
WORKDIR /app

# Install system deps (git for pnpm fetch in some cases)
RUN apk add --no-cache git python3 make g++

# 1. Copy pnpm workspace definition and lockfiles (context root)
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY turbo.json* ./
COPY .npmrc* ./

# 2. Copy the web app package.json (target)
COPY apps/web/package.json ./apps/web/package.json

# 3. Install pnpm globally + install monorepo deps with filter (will not hoist incorrectly, installs web deps + root)
RUN npm install -g pnpm@^9.0.0 && \
    pnpm config set fetch-retries 5 && \
    pnpm install --filter web... --frozen-lockfile=false || \
    pnpm install --filter web...

# 4. Copy Angular sources + tsconfig + environment files (context root)
COPY apps/web/tsconfig*.json ./apps/web/
COPY apps/web/angular.json ./apps/web/
COPY apps/web/src ./apps/web/src/
COPY apps/web/environments* ./apps/web/ 2>/dev/null || true
COPY apps/web/tsconfig* ./apps/web/ 2>/dev/null || true

# 5. Production build (Angular 18 output: dist/web/browser)
RUN pnpm --filter web exec ng build --configuration production

# STAGE 2: Production runtime (Nginx Alpine)
FROM nginx:1.27-alpine

# Security: run as nginx user default, remove default conf, copy our reverse proxy
RUN rm -f /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist/web/browser /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Verify the Nginx config syntax at build time
RUN nginx -t 2>&1 || true

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
