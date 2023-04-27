import requests
import pandas as pd

response = requests.get('https://virkailija.testiopintopolku.fi/lokalisointi/cxf/rest/v1/localisation', params={'category': 'ludos'})
data = response.json()

# Filter out objects with missing translations
translations = {}
for obj in data:
    key = obj['key']
    locale = obj['locale']
    value = obj['value']
    if key not in translations:
        translations[key] = {'fi': '', 'sv': ''}
    translations[key][locale] = value

missing_sv_translations = {key: value for key, value in translations.items() if value['fi'] != '' and value['sv'] == ''}
df_missing_sv_translations = pd.DataFrame.from_dict(missing_sv_translations, orient='index', columns=['fi', 'sv'])

df_missing_sv_translations.to_excel('puuttuvat_kaannokset.xlsx')
