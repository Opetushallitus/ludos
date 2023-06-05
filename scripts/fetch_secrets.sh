#!/bin/bash

SERVER_ENV="$(dirname "$0")/../server/.env"

rm -f "$SERVER_ENV"
LUDOS_PALVELUKAYTTAJA_JSON=$(aws --profile oph-ludos-dev secretsmanager get-secret-value --secret-id /UntuvaLudosStack/LudosApplicationStack/OphServiceUserCredentials --query 'SecretString' | jq -r .)
echo "LUDOS_PALVELUKAYTTAJA_USERNAME=\"$(echo "$LUDOS_PALVELUKAYTTAJA_JSON" | jq -r .username)\"" >> "$SERVER_ENV"
echo "LUDOS_PALVELUKAYTTAJA_PASSWORD=\"$(echo "$LUDOS_PALVELUKAYTTAJA_JSON" | jq -r .password)\"" >> "$SERVER_ENV"

PLAYWRIGHT_ENV="$(dirname "$0")/../playwright/.env"

rm -f "$PLAYWRIGHT_ENV"
TESTIKAYTTAJA_YLLAPITAJA_JSON=$(aws --profile oph-ludos-utility secretsmanager get-secret-value --secret-id /untuva/playwright/test_user_yllapitaja --query 'SecretString' | jq -r .)
echo "TESTIKAYTTAJA_YLLAPITAJA_USERNAME=\"$(echo "$TESTIKAYTTAJA_YLLAPITAJA_JSON" | jq -r .username)\"" >> "$PLAYWRIGHT_ENV"
echo "TESTIKAYTTAJA_YLLAPITAJA_PASSWORD=\"$(echo "$TESTIKAYTTAJA_YLLAPITAJA_JSON" | jq -r .password)\"" >> "$PLAYWRIGHT_ENV"