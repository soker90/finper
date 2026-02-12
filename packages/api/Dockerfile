FROM node:24-alpine as builder

RUN corepack enable && corepack prepare pnpm@latest --activate

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

WORKDIR /home/node/app

USER node
ENV TZ=Europe/Madrid

COPY --chown=node:node pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./

COPY --chown=node:node packages/api/package.json ./packages/api/

RUN pnpm install --frozen-lockfile --filter @soker90/finper-api...

COPY --chown=node:node packages/api ./packages/api
RUN pnpm --filter @soker90/finper-api build

# STAGE 2 - Producción
FROM node:24-alpine

ARG MONGODB_USER
ARG MONGODB_PASS
ARG JWT_SECRET
ARG SALT_ROUNDS
ARG LOKI_USER
ARG LOKI_PASSWORD

ENV NPM_CONFIG_LOGLEVEL=info
ENV NODE_ENV=production
ENV TZ=Europe/Madrid

RUN corepack enable && corepack prepare pnpm@latest --activate && \
    apk add --no-cache dumb-init

RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

WORKDIR /home/node/app
USER node

COPY --chown=node:node pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY --chown=node:node packages/api/package.json ./packages/api/

RUN pnpm install --frozen-lockfile --filter @soker90/finper-api... --prod

COPY --from=builder --chown=node:node /home/node/app/packages/api/dist ./packages/api/dist

# Healthcheck para monitoreo
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3008/api/monit/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3008

ENTRYPOINT ["dumb-init", "--"]
CMD ["pnpm", "--filter", "@soker90/finper-api", "start:pro"]
