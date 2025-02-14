# syntax=docker/dockerfile:1@sha256:93bfd3b68c109427185cd78b4779fc82b484b0b7618e36d0f104d4d801e66d25

FROM node:23@sha256:a182b9b37154a3e11e5c1d15145470ceb22069646d0b7390de226da2548aa2a7 as web-build

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


FROM gradle:jdk17@sha256:cd50c1a698a2d3ef4a3c4bdd1d6076de4027a19cb8254cc2df2305c18b7776dd as server-build

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
