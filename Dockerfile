FROM node:lts-alpine as builder

WORKDIR /app

COPY package*.json .

RUN npm ci

COPY . .

RUN npm run build

FROM node:lts-alpine

WORKDIR /app

COPY --from=builder ./app/package*.json ./
COPY --from=builder ./app/dist ./dist

RUN npm install --production

EXPOSE 3000

ENTRYPOINT [ "node", "." ]