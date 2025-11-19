# Node.js Backend Dockerfile
FROM node:18-alpine

# Metadata
LABEL maintainer="SwapS Project"
LABEL description="SwapS Backend API Server"

# Çalışma dizinini ayarla
WORKDIR /app

# Package files'ı kopyala
COPY package*.json ./

# Dependency'leri yükle
RUN npm ci --only=production && npm cache clean --force

# Uygulama kodunu kopyala
COPY . .

# Config dizinini oluştur (eğer yoksa)
RUN mkdir -p config

# Port'u expose et
EXPOSE 3000

# Health check ekle
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Uygulamayı başlat
CMD ["node", "index.js"]

