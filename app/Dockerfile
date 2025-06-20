FROM node:22 AS builder

WORKDIR /app

COPY package.json yarn.lock index.html typed-scss-modules.config.ts tsconfig.json vite.config.ts .yarnrc.yml ./
COPY .yarn /app/.yarn
COPY src /app/src
COPY assets /app/assets

RUN yarn && \
    yarn build


FROM nginx:alpine AS production

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
