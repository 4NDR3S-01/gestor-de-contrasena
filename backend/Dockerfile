# Utiliza una imagen oficial de Node.js como base
FROM node:20-slim

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala las dependencias de producción
RUN npm install --omit=dev

# Copia el resto del código fuente
COPY . .

# Compila el código TypeScript
RUN npm run build

# Expone el puerto (ajusta si tu app usa otro)
EXPOSE 8080

# Comando para iniciar la app (ajusta si tu entrypoint es diferente)
CMD ["node", "dist/src/servidor.js"]
