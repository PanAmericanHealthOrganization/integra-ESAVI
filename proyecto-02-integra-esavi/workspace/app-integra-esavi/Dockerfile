# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.12.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_KEYCLOAK_URL
ARG VITE_KEYCLOAK_REALM
ARG VITE_KEYCLOAK_CLIENT_ID
ARG VITE_INTEGRA_ESAVI_API_URL
ARG VITE_API_KEY
ARG VITE_ESAVI_GRAVE
ARG VITE_ESAVI_DASHBOARD_TOKEN

RUN pnpm build

EXPOSE 5173

CMD ["pnpm", "preview", "--host", "0.0.0.0", "--port", "5173"]
