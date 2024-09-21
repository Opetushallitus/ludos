FROM amazoncorretto:23-alpine3.17

# NOTE! gradle build must be done before docker build

WORKDIR /ludos
COPY docker-build/run.sh server/build/libs/ludos.jar ./

EXPOSE 8080
ENTRYPOINT [ "./run.sh" ]