#!/usr/bin/env bash

function main {
  pushd playwright
  npx playwright test --config=playwright.config.ts \
  ${RUN_LOCAL_TESTS_IN_UI_MODE:+--ui-port=9876} \
  ${RUN_LOCAL_TESTS_IN_UI_MODE:+--ui-host=0.0.0.0} "$@"
}

main "$@"

