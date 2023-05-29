#!/bin/sh

TESTIKAYTTAJA_YLLAPITAJA_JSON=$(aws --profile oph-ludos-utility secretsmanager get-secret-value --secret-id /untuva/playwright/test_user_yllapitaja --query 'SecretString' | jq -r .)
echo "TESTIKAYTTAJA_YLLAPITAJA_USERNAME=$(echo "$TESTIKAYTTAJA_YLLAPITAJA_JSON" | jq -r .username)"
echo "TESTIKAYTTAJA_YLLAPITAJA_PASSWORD=$(echo "$TESTIKAYTTAJA_YLLAPITAJA_JSON" | jq -r .password)"
