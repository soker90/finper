FROM node:18 as build

WORKDIR /app

ARG API_HOST
ENV VITE_API_HOST=$API_HOST

ENV PATH /app/node_modules/.bin:$PATH

COPY --chown=node:node package.json ./

RUN npm i --legacy-peer-deps

COPY --chown=node:node . ./

RUN npm run build

# production environment
FROM nginx:stable

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3009

CMD ["nginx", "-g", "daemon off;"]
