# Stage 1: Build the application
FROM bitnami/node:18 AS build
LABEL authors="zepolar"

WORKDIR /app

ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copy package.json and package-lock.json (if using npm)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Create a lightweight runtime image
FROM bitnami/node:18
LABEL authors="zepolar"
RUN addgroup zepolar && useradd -s /bin/bash -d /home/zepolar -m -g zepolar zepolar

RUN apt-get update && apt-get install -y \
      chromium \
      wget \
      r-base  \
      r-base-dev \
      && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV HOST_DATABASE="db" \
    PORT_DATABASE="5432" \
    USER_DATABASE="" \
    PASS_DATABASE="" \
    NAME_DATABASE="" \
    SCHEMA_DATABASE="" \
    TZ="Europe/Rome" \
    LANG="en_US.UTF-8" \
    LANGUAGE="en_US:en" \
    NODE_ENV=des

# Copy only the necessary files from the build stage
COPY .$NODE_ENV.env .env
COPY --from=build --chown=zepolar:zepolar  /app/package*.json ./
COPY --from=build --chown=zepolar:zepolar /app/dist ./dist
COPY --from=build --chown=zepolar:zepolar /app/node_modules ./node_modules
COPY --chown=zepolar:zepolar ./quarto.sh ./
COPY --chown=zepolar:zepolar ./example.qmd ./

RUN chmod +x /app/quarto.sh && sh ./quarto.sh

USER zepolar

# Install production dependencies
#RUN npm ci --only=production

# Expose the application port (if necessary)
EXPOSE 3000

# Start the application
CMD ["node", "./dist/main"]