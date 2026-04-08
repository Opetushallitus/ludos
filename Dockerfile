# syntax=docker/dockerfile:1@sha256:4a43a54dd1fedceb30ba47e76cfcf2b47304f4161c0caeac2db1c61804ea3c91

FROM node:24@sha256:80fc934952c8f1b2b4d39907af7211f8a9fff1a4c2cf673fb49099292c251cec AS web-build

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


FROM gradle:jdk25@sha256:c8306012dca73fc20ded7d0ac88f564a6a14a673d9b16431e9d23a344ec604ce AS server-build

WORKDIR /ludos-build
COPY server/settings.gradle.kts server/build.gradle.kts .
RUN  gradle --no-daemon dependencies --refresh-dependencies

COPY --from=web-build /ludos-web/dist/ ./src/main/resources/static/
COPY server/src/ ./src/
RUN gradle --no-daemon bootJar

FROM amazoncorretto:25.0.2-alpine@sha256:afb37b0939cf8e627e7a18569b661cd3470611e65639d128f7a709d65615482e

RUN apk add curl

WORKDIR /ludos-server
COPY --from=server-build /ludos-build/build/libs/ludos.jar .

EXPOSE 8080

ENTRYPOINT java -jar -Dspring.profiles.active="$SPRING_PROFILES_ACTIVE" ./ludos.jar
