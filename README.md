# Ludos

## Käsitteet

Keskeiset entiteetit, ja järjestelmät, joihin nämä tallennetaan.

| käsite      | selite                                       | tunniste     | tallennuspaikka |
|-------------|----------------------------------------------|--------------|-----------------|
| Koodisto    | Kooditus objekteille, esim tutkintonimikkeet | id (tekstiä) | Koodistopalvelu |
| Koodi       | Yksittäisen objektin koodi koodistossa       | id (tekstiä) | Koodistopalvelu |
| Exam        | Koe tyyppi                                   | -            | -               |
| ContentType | Sisältö tyyppi                               |              |                 |
| Assignment  | Koetehtävä                                   |              |                 |
| Instruction | Ohjeet ja tukimateriaalit                    |              |                 |

## Teknologiat

Nämä ovat keskeiset LUDOS-järjestelmässä käytettävät teknologiat. Lista kuvaa järjestelmän nykytilaa ja muuttuu matkan varrella tarpeen mukaan.

- PostgreSQL xx.xx -tietokanta
- Palvelinteknologiat
    - Kotlin (Java 17)
    - Spring boot
    - Flyway-migraatiotyökalu kannan skeeman rakentamiseen ja päivittämiseen kehityksessä ja tuotannossa
    - Gradle buildaa
- Web-sovelluksen frontend-teknologiat
    - yarn-työkalu riippuvuuksien hakuun
    - Vite
    - TypeScript
    - React
    - Tailwind
    - Playwright e2e-testaukseen
    - Vitest yksikkötestaukseen
    - React-pdf pdf generointi
    - Tiptap tekstieditori

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
- `local` = devaus ja testaus osoitteessa localhost:8080
- `untuva` = https://ludos.untuvaopintopolku.fi/ = AWS Fargatessa pyörivä Untuva-LUDOS
- `qa` = https://ludos.testiopintopolku.fi/ = AWS Fargatessa pyörivä QA-LUDOS

Vaihtoehtoja backendin ajamiseen:
1) Repon juuressa `.env`, jossa tarvittavat salaisuudet: `aws --profile oph-ludos-dev sso login && aws --profile oph-ludos-utility sso login && scripts/fetch_secrets.sh`
2) Aja `LudosApplication.kt`:n main-metodi IDEAsta. Lisää run configurationiin halutut profiilit, esim. `local` ja lisää working directory `server`
3) `SPRING_PROFILES_ACTIVE=local server/gradlew bootRun -p server bootRun`
4) `server/gradlew build -p server -x test && LUDOS_PROFILES=local docker-build/run.sh`
   * Tää buildaa myös frontendin, joka tarjoillaan https://localhost:8080/:sta spring
     bootin kautta kuten tuotannossa.
   * 8080-portissa frontti ei kuitenkaan päivity itsestään vaikka `yarn dev` ois päällä
     `web`-kansiossa, vaan siellä on ajettava `yarn build` erikseen joka kerta.
   * Fronttia devatessa onkin suositeltavaa ajaa `web`-kansiossa `yarn dev` ja
     käyttää selaimessa porttia `8000` eikä `8080` niin autoreloadid yms toimii
5) `build:docker` + `run:docker` (profiili kovakoodattu `local`)

### Frontend

Vaihtoehtoja:
1) `yarn dev:web` käynnistää viten porttiin 8000
   * **HUOM!** CAS-autentikaatio ei toimi vite-portin 8000 kautta. Kirjaudu portissa 8080 tai mocklogin-endpointilla: http://localhost:8000/api/test/mocklogin/YLLAPITAJA
2) `yarn build:web` buildaa frontin server-kansion alle, ja backend tarjoilee sen portista 8080 samalla tavalla kuin tuotannossa.

### Playwright e2e
- Ympäristö
  - Varmista että .env tiedostot ovat ajantasalla (ks backend)
  - Lokaalissa backend pystyssä ja frontend käynnissä viten kautta: `yarn dev:web`
- Ajo
  - vs coden testing näkymästä
  - Komentoriviltä `yarn playwright`
  - Huom: CI:llä playwright ajetaan buildattua fronttia ja porttia 8080 vasten


## Riippuvuuksien päivitykset

Vielä manuaalisesti, mutta tarkoitus automatisoida vähintään fronttidepsupäivitykset Dependabot-tyyliin, kunhan
ehditään. Tehdään uusi pull request jokaista depsupäivityskierrosta varten.

### Backend

1) `cd server`
2) `./gradlew refreshVersions` lisää saatavilla olevat uudemmat versiot versions.propertiesiin kommentteina
3) Päivitä versiot muokkaamalla versions.properties-tiedostoa
4) `./gradlew clean test --rerun-tasks`

### Frontend

1) `cd web`
2) `yarn upgrade --latest`
   * Jos major-päivitys rikkoi softan etkä ehdi/jaksa korjata, niin reverttaa ja aja ilman `--latest`
3) `cd .. && yarn playwright`