#!/bin/bash

set -euo pipefail

SCRIPTDIR=$(dirname "$0")
BACKUP_DIR="$SCRIPTDIR/../server/src/main/resources/backup_data"

KOODISTOURIS=(
    oppiaineetjaoppimaaratlops2021
    laajaalainenosaaminenlops2021
    tehtavatyyppisuko
    taitotaso
    ludoslukuvuosi
    ludoslukiodiplomiaine
    tehtavatyyppipuhvi
    aihesuko
)

for koodistouri in "${KOODISTOURIS[@]}"; do
    echo "Backing up koodisto $koodistouri"
    curl "https://virkailija.testiopintopolku.fi/koodisto-service/rest/json/$koodistouri/koodi?onlyValidKoodis=true" \
        | jq --sort-keys '. | sort_by(.koodiArvo)' \
        | jq '.[].metadata |= sort_by(.kieli)' \
        > "$BACKUP_DIR/koodisto_$koodistouri.json"
done

echo "Backing up lokalisointi..."
curl 'https://virkailija.testiopintopolku.fi/lokalisointi/cxf/rest/v1/localisation?value=NOCACHE&category=ludos' > "$BACKUP_DIR/lokalisointi.json"