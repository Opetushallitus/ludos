#!/bin/bash

cd "$(dirname "$0")" || exit
./gradlew build --continuous &
./gradlew bootRun
./gradlew --stop
