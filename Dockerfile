# syntax=docker/dockerfile:1@sha256:ecfaec9ed6d810b56388c508f4121597bfbba70d41a6dfeee4d8cad5f295fc32

FROM node:24@sha256:64af3819f9275802414d7cdc38c27e9d82bd564dec4d4da87d008255d36c63b4 AS web-build

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


FROM gradle:jdk25@sha256:30f0c2e94f2b91cffaa192cebc86f1ba8efc574b9a8e93b33164e5f2ed839c08 AS server-build

WORKDIR /ludos-build
COPY server/settings.gradle.kts server/build.gradle.kts server/gradle.lockfile ./
COPY --from=web-build /ludos-web/dist/ ./src/main/resources/static/
COPY server/src/ ./src/
RUN gradle --no-daemon bootJar

FROM amazoncorretto:25.0.4-alpine@sha256:4955796538972099d9c7de6e31c6a259b1de65393a58b7e0996b7cc50d7d20a7

RUN apk add --no-cache ca-certificates curl \
    && curl --fail --location https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem --output /etc/ssl/certs/rds-global-bundle.pem

WORKDIR /ludos-server
COPY --from=server-build /ludos-build/build/libs/ludos.jar .

EXPOSE 8080

ENTRYPOINT java -jar -Dspring.profiles.active="$SPRING_PROFILES_ACTIVE" ./ludos.jar
