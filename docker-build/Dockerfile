FROM amazoncorretto:23-alpine3.17@sha256:867be16c84d99f8f71b23bea74e358af4612862fa8695e0640888af2b02ce41c

# NOTE! gradle build must be done before docker build

WORKDIR /ludos
COPY docker-build/run.sh server/build/libs/ludos.jar ./

EXPOSE 8080
ENTRYPOINT [ "./run.sh" ]