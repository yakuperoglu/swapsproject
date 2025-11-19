# Multi-stage build for React Frontend
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Package files'ı kopyala
COPY package*.json ./

# Dependencies yükle
RUN npm ci && npm cache clean --force

# Source code'u kopyala
COPY . .

# Production build
RUN npm run build

# Stage 2: Production
FROM nginx:alpine

# Metadata
LABEL maintainer="SwapS Project"
LABEL description="SwapS Frontend React Application"

# Build edilmiş dosyaları nginx'e kopyala
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx konfigürasyonu (SPA routing için)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://backend:3000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_cache_bypass $http_upgrade; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Port'u expose et
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Nginx'i başlat
CMD ["nginx", "-g", "daemon off;"]

