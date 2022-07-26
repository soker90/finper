FROM node:16 as build

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY package.json ./

RUN npm i --silent

COPY . ./

RUN npm run build

# production environment
FROM nginx:stable

ARG VITE_API_HOST

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3009

CMD ["nginx", "-g", "daemon off;"]