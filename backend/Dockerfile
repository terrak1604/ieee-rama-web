FROM node:20-alpine AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:20-alpine
WORKDIR /usr/src/app

# Instalar wget para healthcheck y crear usuario no-root
RUN apk add --no-cache wget && \
    addgroup -g 1001 -S nodeapp && \
    adduser -u 1001 -S nodeapp -G nodeapp

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --chown=nodeapp:nodeapp . .

# Crear directorios con permisos correctos
RUN mkdir -p /usr/src/app/uploads /data && \
    chown -R nodeapp:nodeapp /usr/src/app /data

USER nodeapp

EXPOSE 3000

CMD ["node", "server.js"]
