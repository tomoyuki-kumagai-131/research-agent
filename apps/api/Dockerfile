FROM mcr.microsoft.com/playwright:v1.48.2-jammy
WORKDIR /app
ENV NODE_ENV=production PORT=8080

RUN corepack enable && corepack prepare pnpm@8.15.9 --activate

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile --filter=@research-agent/api...

WORKDIR /app/apps/api
EXPOSE 8080
CMD ["pnpm", "start"]
