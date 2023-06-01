#!/bin/sh

LUDOS_PALVELUKAYTTAJA_JSON=$(aws --profile oph-ludos-dev secretsmanager get-secret-value --secret-id /UntuvaLudosStack/LudosApplicationStack/OphServiceUserCredentials --query 'SecretString' | jq -r .)
echo "LUDOS_PALVELUKAYTTAJA_USERNAME=$(echo "$LUDOS_PALVELUKAYTTAJA_JSON" | jq -r .username)"
echo "LUDOS_PALVELUKAYTTAJA_PASSWORD=$(echo "$LUDOS_PALVELUKAYTTAJA_JSON" | jq -r .password)"

TESTIKAYTTAJA_YLLAPITAJA_JSON=$(aws --profile oph-ludos-utility secretsmanager get-secret-value --secret-id /untuva/playwright/test_user_yllapitaja --query 'SecretString' | jq -r .)
echo "TESTIKAYTTAJA_YLLAPITAJA_USERNAME=$(echo "$TESTIKAYTTAJA_YLLAPITAJA_JSON" | jq -r .username)"
echo "TESTIKAYTTAJA_YLLAPITAJA_PASSWORD=$(echo "$TESTIKAYTTAJA_YLLAPITAJA_JSON" | jq -r .password)"
