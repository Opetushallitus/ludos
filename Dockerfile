# syntax=docker/dockerfile:1@sha256:4edf897a3ffa55b89f906fc8cc78afdb3f1834cc9c7083565e611a8a7d5fe99e

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


FROM gradle:jdk25@sha256:edf32c2808b6e68cda2e888de4f547aad95bb17004cff49ebc7a00036e3658b4 AS server-build

WORKDIR /ludos-build
COPY server/settings.gradle.kts server/build.gradle.kts server/gradle.lockfile ./
COPY --from=web-build /ludos-web/dist/ ./src/main/resources/static/
COPY server/src/ ./src/
RUN gradle --no-daemon bootJar

FROM amazoncorretto:25.0.4-alpine@sha256:19f1e2198abaaf201f5b9faa39222412da3fad66415e9dfe253bd6763415097e

RUN apk add --no-cache ca-certificates curl \
    && curl --fail --location https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem --output /etc/ssl/certs/rds-global-bundle.pem

WORKDIR /ludos-server
COPY --from=server-build /ludos-build/build/libs/ludos.jar .

EXPOSE 8080

ENTRYPOINT java -jar -Dspring.profiles.active="$SPRING_PROFILES_ACTIVE" ./ludos.jar
