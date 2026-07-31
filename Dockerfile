FROM node:20-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-slim AS runner

WORKDIR /usr/src/app

ENV NODE_ENV="production"

COPY package*.json ./

RUN npm ci --production && npm cache clean --force

COPY --from=builder /usr/src/app/dist ./dist

CMD [ "npm", "start" ]
