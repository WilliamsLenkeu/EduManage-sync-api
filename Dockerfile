# Dockerfile for the sync API

FROM node:20-alpine
WORKDIR /app

# copy package definitions
COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install --frozen-lockfile

# copy code
COPY . .

ENV PORT=3001
EXPOSE 3001

CMD ["pnpm", "start"]
