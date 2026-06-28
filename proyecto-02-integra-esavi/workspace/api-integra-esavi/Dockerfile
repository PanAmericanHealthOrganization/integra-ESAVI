# Stage 1: Build
FROM node:22-bullseye AS build
LABEL authors="zepolar"

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --ignore-workspace

COPY . .

RUN pnpm run build

# Stage 2: Runtime
FROM node:22-bullseye-slim
LABEL authors="zepolar"

RUN groupadd zepolar && useradd -s /bin/bash -d /home/zepolar -m -g zepolar zepolar

RUN apt-get update && apt-get install -y \
      chromium \
      wget \
      && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@9 --activate

ENV HOST_DATABASE="db" \
    PORT_DATABASE="5432" \
    USER_DATABASE="" \
    PASS_DATABASE="" \
    NAME_DATABASE="" \
    SCHEMA_DATABASE="" \
    TZ="America/Guayaquil" \
    NODE_ENV=des \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PATH_BROWSER_PUPPETEER="/usr/bin/chromium"

# Para producción, inyectar variables con env_file o variables de entorno en docker-compose
COPY --chown=zepolar:zepolar .env .env

COPY --from=build --chown=zepolar:zepolar /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build --chown=zepolar:zepolar /app/dist ./dist
COPY --from=build --chown=zepolar:zepolar /app/node_modules ./node_modules

USER zepolar

EXPOSE 3000

CMD ["node", "./dist/main"]
