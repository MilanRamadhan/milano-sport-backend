FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# install deps
COPY package*.json ./
RUN npm ci --omit=dev

# copy source
COPY . .

EXPOSE 5000
CMD ["node", "src/server.js"]
