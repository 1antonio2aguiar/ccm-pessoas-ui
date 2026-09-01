# ==================================================
# ETAPA 1 - COMPILACAO DO ANGULAR
# ==================================================

FROM node:18-alpine AS build

WORKDIR /app

# Copia os arquivos de dependencias primeiro
# para aproveitar o cache do Docker.
COPY package*.json ./

# Instala as dependencias do projeto.
RUN npm install --legacy-peer-deps

# Copia o restante do frontend.
COPY . .

# Gera o build de producao.
RUN npm run build -- --configuration=production


# ==================================================
# ETAPA 2 - EXECUCAO COM NGINX
# ==================================================

FROM nginx:1.25-alpine

# Remove o conteudo padrao do Nginx.
RUN rm -rf /usr/share/nginx/html/*

# O cc-pessoas-ui gera os arquivos diretamente em dist.
COPY --from=build /app/dist/ /usr/share/nginx/html/

# Configuracao da SPA e do proxy para o backend.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]