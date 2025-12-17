FROM node:20-alpine

WORKDIR /usr/src/app

# Package dosyalarını kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Tüm dosyaları kopyala
COPY . .

RUN npm run build

# Port'u aç
EXPOSE 3000



# Uygulamayı başlat
CMD ["npm", "run", "start:dev"]