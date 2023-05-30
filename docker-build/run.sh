#!/bin/sh

if [ -z "$LUDOS_PROFILES" ]; then
    echo "LUDOS_PROFILES is not set"
    exit 1
fi

if [ -r "ludos.jar" ]; then
    JAR_PATH=ludos.jar
else
    JAR_PATH="$(dirname "$0")/../server/build/libs/ludos-0.0.1-SNAPSHOT.jar"
fi

java -jar -Dspring.profiles.active="$LUDOS_PROFILES" "$JAR_PATH"
