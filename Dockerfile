FROM node:24-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Install dependencies (all packages needed for build)
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/core/package.json packages/core/
COPY packages/backend-canvas/package.json packages/backend-canvas/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

# Build the web app and all upstream packages
FROM deps AS build
COPY . .
RUN pnpm build --filter=@nouploads/web...

# Production — minimal alpine image with only server runtime deps
# The server bundle (built by Vite) externalizes these 8 packages;
# everything else (WASM codecs, image libs, PDF engines) is bundled
# into client-side JS and does not need node_modules at runtime.
FROM node:24-alpine AS production
WORKDIR /app
COPY --from=build /app/apps/web/build ./build

# Install only what react-router-serve needs to run the SSR server
RUN npm init -y --silent > /dev/null 2>&1 && \
    npm install --omit=dev --ignore-scripts \
    @react-router/serve@7.13.2 \
    @react-router/node@7.13.2 \
    react-router@7.13.2 \
    react@19.2.4 \
    react-dom@19.2.4 \
    isbot@5.1.36 \
    lucide-react@1.6.0 \
    radix-ui@1.4.3 \
    clsx@2.1.1 \
    tailwind-merge@3.5.0 \
    class-variance-authority@0.7.1 \
    > /dev/null 2>&1

EXPOSE 3000
ENV NODE_ENV=production PORT=3000
CMD ["node", "node_modules/.bin/react-router-serve", "./build/server/index.js"]
