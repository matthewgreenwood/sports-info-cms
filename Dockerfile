FROM node:26.13.1-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY vendor/buffer-equal-constant-time ./vendor/buffer-equal-constant-time
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 1337
CMD ["npm", "start"]
