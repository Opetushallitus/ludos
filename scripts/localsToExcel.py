import requests
import pandas as pd

response = requests.get('https://virkailija.testiopintopolku.fi/lokalisointi/cxf/rest/v1/localisation', params={'category': 'ludos'})
data = response.json()

# Filter out objects with missing translations
translationsMap = {}
for obj in data:
    key = obj['key']
    locale = obj['locale']
    value = obj['value']
    if key not in translationsMap:
        translationsMap[key] = {'fi': '', 'sv': ''}
    translationsMap[key][locale] = value

translations = {key: value for key, value in translationsMap.items() if value['fi'] != ''}
df_missing_translations = pd.DataFrame.from_dict(translations, orient='index', columns=['fi', 'sv'])

df_missing_translations.to_excel('ludos_untuva_kaannokset.xlsx')
