# syntax=docker/dockerfile:1@sha256:87999aa3d42bdc6bea60565083ee17e86d1f3339802f543c0d03998580f9cb89

FROM node:24@sha256:9c1d881a5b3354362cd134d15b6eee789313833caa720c3cb6ea8862925d6eb8 AS web-build

WORKDIR /ludos-web
COPY web/package.json web/package-lock.json ./
RUN npm ci --ignore-scripts=true

COPY web/tsconfig.json .
COPY web/*.config.cjs .
COPY web/vite.config.ts .
COPY web/tailwind.config.ts .
COPY web/index.html .
COPY web/assets/ ./assets/
COPY web/src/ ./src/
RUN npm run build:ci


FROM gradle:jdk25@sha256:8de3543f1772bb66be3b275893e5977b6d8bd2b0d25551faa5846a821d1f0600 AS server-build

WORKDIR /ludos-build
COPY server/settings.gradle.kts server/build.gradle.kts .
RUN  gradle --no-daemon dependencies --refresh-dependencies

COPY --from=web-build /ludos-web/dist/ ./src/main/resources/static/
COPY server/src/ ./src/
RUN gradle --no-daemon bootJar

FROM amazoncorretto:25.0.3-alpine@sha256:d0915ce12f1c011cc332c32ea21ec8ad85ef47b03e46f1a4bfa8c5cd602468a4

RUN apk add --no-cache ca-certificates curl \
    && curl --fail --location https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem --output /etc/ssl/certs/rds-global-bundle.pem

WORKDIR /ludos-server
COPY --from=server-build /ludos-build/build/libs/ludos.jar .

EXPOSE 8080

ENTRYPOINT java -jar -Dspring.profiles.active="$SPRING_PROFILES_ACTIVE" ./ludos.jar
