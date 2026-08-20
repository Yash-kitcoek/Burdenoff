FROM oven/bun:1.2-alpine AS base
WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install

COPY prisma ./prisma
RUN bunx prisma generate

COPY src ./src
EXPOSE 4000
CMD ["bun", "run", "start"]
