FROM amazoncorretto:17-alpine3.17

# NOTE! gradle build must be done before docker build

WORKDIR /ludos
COPY docker-build/run.sh run.sh
COPY server/build/libs/ludos-0.0.1-SNAPSHOT.jar ludos.jar

EXPOSE 8080
ENTRYPOINT [ "./run.sh" ]