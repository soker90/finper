FROM node:16

ARG MONGODB_USER
ARG MONGODB_PASS
ARG JWT_SECRET
ARG SALT_ROUNDS
ARG LOKI_USER
ARG LOKI_PASSWORD

ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_ENV production

ADD dist /home/node/app/dist
ADD package.json /home/node/app/package.json

RUN chown -R node:node /home/node/app

USER node
ENV TZ Europe/Madrid
WORKDIR /home/node/app
RUN npm install --save

EXPOSE 3000

# CMD ["npm", "start:pro"]
CMD npm run start:pro
