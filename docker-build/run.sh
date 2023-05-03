#!/bin/sh

cd server
./gradlew bootRun --args="--env=prod"
