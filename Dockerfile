FROM node:20-alpine AS builder
WORKDIR /app

# Build frontend
COPY frontend/ ./frontend/
RUN cd frontend && npm install && npm run build

# Install backend deps + generate Prisma client
COPY backend/ ./backend/
RUN cd backend && npm install && npx prisma generate

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Install system deps (PDF fonts)
RUN apk add --no-cache fontconfig ttf-freefont

# Copy backend (includes node_modules with prisma, ts-node)
COPY --from=builder /app/backend /app/backend

# Copy frontend build
COPY --from=builder /app/frontend/dist /app/frontend/dist

EXPOSE 8080

CMD cd backend && npx prisma migrate deploy && npx ts-node -T prisma/seed.ts && npx ts-node -T src/app.ts
