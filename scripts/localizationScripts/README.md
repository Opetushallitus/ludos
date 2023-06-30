# Käännösprosessi

### QA - Virallinen Totuus käännösten tilasta:
- QA:n tulisi olla aina ajantasainen käännösten osalta
- Ei siis käytetä tuotantoa vaan QA:ta auktoriteettina, koska sinne tulee eniten muutoksia, esimerkiksi käännökset ja hyväksyntätestausmuutokset.
- EPÄSELVÄÄ VIELÄ: JYRÄYTYYKÖ QA:N DATA JOSKUS?
  - "Ulla: Välillä teemme tuotantodatan siirtoa QA:lle, jolloin joidenkin palvelujen data QA:ssa saattaa päivittyä tuotantodatan mukaiseksi."
### Devaajien rooli:
- Devaajat lisäävät uuden ominaisuuden vaatimat käännösavaimet ja alustavat suomenkieliset käännökset Untuvalle.
- Devaajat hoitavat myös uudet alustavat käännökset QA:lle viimeistään, kun sinne viedään hyväksyntätestattava versio.
  - Katsotaan voidaanko Untuva -> QA siirto tehdä kälistä vai tarvitaanko skripti
### Kääntäjän rooli ja hyväksyntätestaus:
- Kääntäjän työnkulku:
  1. Kääntäjä pyytää devaajalta excelin, jossa on kaikki QA-ympäristön käännösavaimet ja niiden suomennokset ja ruotsinnokset
     * Devaaja luo excelin ajamalla skriptin `localizationsFromQaToExcel.ts`
  2. Kääntäjä täyttää excelin käyttelemällä QA-LUDOSia ja höydyntämällä Näytä avaimet -toiminnallisuutta
  3. Kääntäjä lähettää excelin devaajalle
     * Devaaja vie excelin QA-ympäristön käännöspalveluun ajamalla skriptin `localizationsFromExcelToQa.ts`
- Kääntäjä tekee ruotsinnokset jossain vaiheessa prosessia, ehkä selkeintä on, jos tämä tapahtuu QA:lla.
- Hyväksyntätestauksessa ilmenevät tekstimuutokset viedään QA:n käännöspalveluun joko suoraan tai tämän excel-prosessin kautta.
### Tuotanto ja käännökset:
- Jos tuotantoon (jota ei vielä ole) tarvitaan tekstimuutos, muutos voisi ensin tehdä QA:lle, ja viedä sitten sieltä tuotantoon.
- Ludos-tuotantoonviennin yhteydessä QA:n käännökset viedään tuotantoon.
### Devaajien ja QA:n välinen yhteistyö:
- Devaajat vievät välillä muuttuneet käännökset QA:lta Untuvaan.
  - Katsotaan voiko tämän hoitaa kälistä, vai tarvitaanko tähänkin skripti