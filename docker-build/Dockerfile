FROM amazoncorretto:17-alpine3.17

EXPOSE 8080

WORKDIR /ludos

COPY . .
COPY docker-build/run.sh .

RUN cd server && ./gradlew build

RUN apk add nodejs yarn
RUN cd web && yarn build && cd ..
RUN cp -r web/dist server/build/resources/main/static

ENTRYPOINT [ "./run.sh" ]