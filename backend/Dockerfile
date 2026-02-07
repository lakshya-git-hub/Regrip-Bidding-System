FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the TypeScript project
RUN npm run build

EXPOSE 5000

# Run migrations and start the server
CMD ["sh", "-c", "npx prisma db push && npm start"]
