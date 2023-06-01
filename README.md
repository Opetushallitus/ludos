# Ludos

## Käsitteet

Keskeiset entiteetit, ja järjestelmät, joihin nämä tallennetaan.

| käsite   | selite                                       | tunniste        | tallennuspaikka |
|----------|----------------------------------------------|-----------------|-----------------|
| Koodisto | Kooditus objekteille, esim tutkintonimikkeet | id (tekstiä)    | Koodistopalvelu |
| Koodi    | Yksittäisen objektin koodi koodistossa       | id (tekstiä)    | Koodistopalvelu |
| Oppija   | Opiskelija, oppilas.                         | id (numeerinen) | -               |

## Teknologiat

Nämä ovat keskeiset Koski-järjestelmässä käytettävät teknologiat. Lista kuvaa järjestelmän nykytilaa ja muuttuu matkan
varrella
tarpeen mukaan.

- PostgreSQL xx.xx -tietokanta
- Palvelinteknologiat
    - Kotlin (Java 17)
    - Spring boot
    - Flyway-migraatiotyökalu kannan skeeman rakentamiseen ja päivittämiseen kehityksessä ja tuotannossa
- Web-sovelluksen frontend-teknologiat
    - yarn-työkalu riippuvuuksien hakuun
    - Vite
    - TypeScript
    - React
    - SCSS

## Kehitystyökalut

Minimissään tarvitset nämä:

- Git (osx, linux sisältää tämän, komentorivillä `git`)
- JDK 17
- Docker PostgreSQL:n
- Tekstieditori (kehitystiimi käyttää IntelliJ IDEA)

## Ajaminen paikallisesti

### Backend

Backend tarttee possun: `docker compose up`

Backendiä ajettaessa on valittava sopiva ympäristöprofiili:
- `local` = devaus ja testaus osoitteessa localhost:8080, autentikaatio on disabloitu
- `local-untuvacas` = devaus ja testaus osoitteessa localhost:8080, oikea CAS-autentikaatio Untuva-ympäristössä
- `untuva` = https://ludos.untuvaopintopolku.fi/ = AWS Fargatessa pyörivä Untuva-cas

Vaihtoehtoja backendin ajamiseen:
1) Aja `LudosApplication.kt`:n main-metodi IDEAsta. Lisää run configurationiin halutut profiilit, esim. `local`
1) `server/gradlew bootRun -p server bootRun --args='--spring.profiles.active=local'`
1) `server/gradlew build -p server -x test && LUDOS_PROFILES=local docker-build/run.sh`
  * Tää buildaa myös frontendin, joka tarjoillaan https://localhost:8080/:sta spring
    bootin kautta kuten tuotannossa.
  * 8080-portissa frontti ei kuitenkaan päivity itsestään vaikka `yarn dev` ois päällä
    `web`-kansiossa, vaan siellä on ajettava `yarn build` erikseen joka kerta.
  * Fronttia devatessa onkin suositeltavaa ajaa `web`-kansiossa `yarn dev` ja
    käyttää selaimessa porttia `8000` eikä `8080` niin autoreloadid yms toimii
1) `build:docker` + `run:docker` (profiili kovakoodattu `local`)

### Frontend

Vaihtoehtoja:
1) `yarn dev:web` käynnistää viten porttiin 8000
1) `yarn build:web` buildaa frontin server-kansion alle, ja backend tarjoilee sen portista 8080 samalla tavalla kuin tuotannossa.

### Playwright e2e
- Ympäristö
  - Repon juuressa `.env`, jossa tarvittavat salaisuudet: `aws --profile oph-ludos-dev sso login && aws --profile oph-ludos-utility sso login && yarn generate:secret_file`
  - Lokaalissa backend pystyssä ja frontend käynnissä viten kautta: `yarn dev:web`
- Ajo
  - vs coden testing näkymästä
  - Komentoriviltä `yarn playwright`
  - Huom: CI:llä playwright ajetaan buildattua fronttia ja porttia 8080 vasten
