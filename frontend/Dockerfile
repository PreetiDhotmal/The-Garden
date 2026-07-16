# --- Build stage ---
FROM node:20-slim AS build
WORKDIR /workspace

RUN corepack enable
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY frontend/package.json ./frontend/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @the-garden/frontend build

# --- Run stage ---
FROM nginx:1.27-alpine AS run
COPY --from=build /workspace/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
