#!/bin/sh

if [ -z "$ENV_NAME" ]; then
    echo "ENV_NAME is not set"
    exit 1
fi

if [ -r "ludos.jar" ]; then
    JAR_PATH=ludos.jar
else
    JAR_PATH="$(dirname "$0")/../server/build/libs/ludos-0.0.1-SNAPSHOT.jar"
fi

java -jar -Dspring.profiles.active="$ENV_NAME" "$JAR_PATH"
