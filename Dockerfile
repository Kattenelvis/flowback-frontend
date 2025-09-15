# syntax=docker/dockerfile:1
FROM node:22.9.0 AS base
WORKDIR /usr/src/app

# install deps (dev deps needed because 'prepare' runs)
COPY package*.json ./
RUN npm ci

# copy source
COPY . .

EXPOSE 4000
# --host lets SvelteKit accept connections from outside the container
CMD ["npm", "run", "dev", "--", "--port", "4000", "--host"]