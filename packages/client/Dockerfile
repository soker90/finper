FROM node:24-alpine as build

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

WORKDIR /home/node/app

USER node

ARG API_HOST
ENV VITE_API_HOST=$API_HOST
ENV TZ=Europe/Madrid

COPY --chown=node:node pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY --chown=node:node .npmrc* ./
COPY --chown=node:node packages/client/package.json ./packages/client/

RUN pnpm install --frozen-lockfile --filter @soker90/finper-client...
COPY --chown=node:node packages/client ./packages/client

RUN pnpm --filter @soker90/finper-client build

# STAGE 2 - Producción con nginx
FROM nginx:stable-alpine

COPY --from=build /home/node/app/packages/client/dist /usr/share/nginx/html
COPY packages/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3009

CMD ["nginx", "-g", "daemon off;"]
