FROM amazoncorretto:17-alpine3.17

EXPOSE 8080

WORKDIR /ludos

COPY . .
COPY docker-build/run.sh .

RUN cd server && ./gradlew build -x test

RUN apk add nodejs yarn
RUN cd web && yarn install && yarn build && cd ..

ENTRYPOINT [ "./run.sh" ]