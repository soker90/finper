FROM node:24-alpine as build

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

WORKDIR /home/node/app

USER node

ARG API_HOST=/api/
ENV VITE_API_HOST=$API_HOST
ENV TZ=Europe/Madrid

COPY --chown=node:node pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY --chown=node:node .npmrc* ./
COPY --chown=node:node packages/client/package.json ./packages/client/
COPY --chown=node:node packages/types/package.json ./packages/types/

RUN pnpm install --frozen-lockfile --filter @soker90/finper-client...
COPY --chown=node:node packages/client ./packages/client
COPY --chown=node:node packages/types ./packages/types

RUN pnpm --filter @soker90/finper-client build

# STAGE 2 - Producción con nginx
FROM nginx:stable-alpine

# Host:puerto de la API vista desde el contenedor del cliente. Con red bridge
# (docker-compose) el nombre de servicio "api" resuelve solo. Con red host
# sobreescribe a "127.0.0.1:3008" (IP literal, no "localhost": el resolver
# 127.0.0.11 de Docker que usa nginx.conf.template no existe en modo host).
ENV API_UPSTREAM=api:3008

COPY --from=build /home/node/app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 3009

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- --spider http://127.0.0.1:3009/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
