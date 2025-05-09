# syntax=docker/dockerfile:1@sha256:9857836c9ee4268391bb5b09f9f157f3c91bb15821bb77969642813b0d00518d

FROM node:23@sha256:ee8a0bc5bbaece0c538c76e7c20fde6d4db319bbd5d4e423940999f16da89aa1 as web-build

WORKDIR /ludos-web
COPY web/package.json web/package-lock.json .
RUN npm ci

COPY web/tsconfig.json .
COPY web/*.config.cjs .
COPY web/vite.config.ts .
COPY web/tailwind.config.ts .
COPY web/index.html .
COPY web/assets/ ./assets/
COPY web/src/ ./src/
RUN npm run build:ci


FROM gradle:jdk17@sha256:e92df1d16c3552a4a5127a5e43294ee255183131c682063408ddf920cfc993d3 as server-build

WORKDIR /ludos-build
COPY server/settings.gradle.kts server/build.gradle.kts .
RUN --mount=type=secret,id=github_token,required=true \
  GITHUB_TOKEN=$(cat /run/secrets/github_token) \
  gradle --no-daemon dependencies --refresh-dependencies

COPY --from=web-build /ludos-web/dist/ ./src/main/resources/static/
COPY server/src/ ./src/
RUN --mount=type=secret,id=github_token,required=true \
  GITHUB_TOKEN=$(cat /run/secrets/github_token) \
  gradle --no-daemon bootJar

FROM amazoncorretto:23-alpine3.17@sha256:867be16c84d99f8f71b23bea74e358af4612862fa8695e0640888af2b02ce41c

RUN apk add curl

WORKDIR /ludos-server
COPY --from=server-build /ludos-build/build/libs/ludos.jar .

EXPOSE 8080

ENTRYPOINT java -jar -Dspring.profiles.active="$SPRING_PROFILES_ACTIVE" ./ludos.jar
