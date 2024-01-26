FROM node:20-alpine as builder

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app
# RUN npm config set unsafe-perm true

USER node
ENV TZ Europe/Madrid

COPY package*.json ./
RUN npm install

COPY --chown=node:node . .
CMD ["npm","run","build"]

# STAGE 2
FROM node:20-alpine

ARG MONGODB_USER
ARG MONGODB_PASS
ARG JWT_SECRET
ARG SALT_ROUNDS
ARG LOKI_USER
ARG LOKI_PASSWORD

ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_ENV prod

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app
USER node
ENV TZ Europe/Madrid
COPY --chown=node:node package.json ./

RUN npm install --production
COPY --from=builder /home/node/app/dist ./dist

EXPOSE 3008
CMD ["npm","run","start:pro"]
