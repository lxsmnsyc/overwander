# The app server. `scripts/deploy.sh` builds it through compose.yaml,
# which hands .env to the build as a secret so it never lands in a layer.

FROM node:26-slim AS build
WORKDIR /app
# Node 25 stopped bundling corepack; it reads the pnpm version from packageManager
RUN npm install -g corepack && corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# Vite bakes the VITE_ variables into the client, so the build reads .env too
ARG BUILD_ID
RUN --mount=type=secret,id=env,target=/app/.env BUILD_ID=$BUILD_ID pnpm build

# Nitro traces what the server imports into .output, so nothing else is needed
FROM node:26-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
