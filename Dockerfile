# Utiliza una imagen oficial de Node.js como base
FROM node:20-slim AS build-frontend

# Establece el directorio de trabajo
WORKDIR /app/frontend

# Copia solo los archivos de dependencias primero para aprovechar el cache
COPY frontend/package*.json ./

# Instala las dependencias de desarrollo y producción para el frontend
RUN npm install

# Copia el resto del código fuente del frontend
COPY frontend/. .

# Compila el código TypeScript
RUN npm run build

FROM node:20-slim AS build-backend

# Establece el directorio de trabajo
WORKDIR /app/backend

# Copia solo los archivos de dependencias primero para aprovechar el cache
COPY backend/package*.json ./

# Instala las dependencias de desarrollo y producción para el backend
RUN npm install

# Copia el resto del código fuente del backend
COPY backend/. .

# Copia el build del frontend al backend (ajusta si tu backend espera otra ruta)
COPY --from=build-frontend /app/frontend/dist ./public

# Compila el código TypeScript del backend
RUN npm run build

# Etapa final: imagen para ejecutar la aplicación
FROM node:20-slim

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia el código del backend ya construido
COPY --from=build-backend /app/backend .

# Expone el puerto (ajusta si tu app usa otro)
EXPOSE 8080

# Comando para iniciar la app (ajusta si tu entrypoint es diferente)
CMD ["node", "dist/src/servidor.js"]
