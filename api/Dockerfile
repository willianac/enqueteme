FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY nest-cli.json prisma.config.ts tsconfig*.json ./
COPY prisma ./prisma
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY prisma.config.ts ./
COPY prisma ./prisma
USER node
EXPOSE 8080
CMD ["npm", "run", "start:prod"]
