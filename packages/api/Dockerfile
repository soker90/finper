FROM node:16

ARG GITLAB_REGISTRY_TOKEN
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

RUN echo "@devstarlight:registry=https://gitlab.com/api/v4/projects/35369216/packages/npm/\n//gitlab.com/api/v4/projects/35369216/packages/npm/:_authToken=uaYWdgGLmsp43SMzNM1C" > /home/node/app/.npmrc

RUN chown -R node:node /home/node/app 

USER node
WORKDIR /home/node/app
RUN npm install --save

EXPOSE 3000

# CMD ["npm", "start:pro"]
CMD npm run start:pro