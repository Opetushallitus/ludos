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

## Tietokanta

```shell
docker compose up
```

### Backend

Aja main-luokka IDEAsta, tai käynnistä vaihtoehtoisesti komentoriviltä

### Frontend

```shell
yarn dev
```

### Playwright e2e
- Ympäristö
  - Lokaalissa backend pystyssä ja frontend buildattuna komennolla `yarn build:ci`
  - Tai vaihtoehtoisesti `yarn dev` ja muutos playwright configissa `baseUrl: 'http://localhost:8080'` 
- Ajo
  - vs coden testing näkymästä
  - Komentoriviltä `yarn test:e2e`
