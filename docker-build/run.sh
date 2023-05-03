#!/bin/sh

set -euo pipefail

cd server
./gradlew bootRun --args="--spring.profiles.active=$ENV_NAME"
