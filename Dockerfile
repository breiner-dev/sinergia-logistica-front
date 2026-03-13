FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json ./
COPY pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile || pnpm install

COPY . .

RUN pnpm build

FROM nginx:stable-alpine

COPY --from=build /app/dist/sinergia-logistica/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
