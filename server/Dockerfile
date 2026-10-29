FROM node:24-bookworm-slim AS build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npm run build

FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=build /app/server/dist ./dist
COPY server/migrations ./migrations
COPY server/public ./public
COPY dist ./public-app
ENV STATIC_DIR=/app/public-app
RUN mkdir -p /app/data/files
EXPOSE 8080
CMD ["sh", "-c", "node dist/migrate.js && node dist/index.js"]
