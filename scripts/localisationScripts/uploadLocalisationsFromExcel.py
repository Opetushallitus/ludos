import pandas as pd
import requests
import json


def update_localizations_from_excel(file_path):
    df = pd.read_excel(file_path)
    url = 'https://virkailija.untuvaopintopolku.fi/lokalisointi/cxf/rest/v1/localisation/update'
    headers = {
        'authority': 'virkailija.untuvaopintopolku.fi',
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json; charset=UTF-8',
        'caller-id': '1.2.246.562.10.00000000001.lokalisointi-frontend',
        'cookie': 'JSESSIONID=00000000000000000000000000000000; CSRF=00000000000000000000000000000000',
        'csrf': '00000000000000000000000000000000',
    }

    payload_array = [
                        {
                            'category': 'ludos',
                            'key': row[0],
                            'locale': 'fi',
                            'value': row[1]
                        }
                        for _, row in df.iterrows()
                    ] + [
                        {
                            'category': 'ludos',
                            'key': row[0],
                            'locale': 'sv',
                            'value': row[2]
                        }
                        for _, row in df.iterrows()
                    ]

    print(json.dumps(payload_array))
    print("Did not post, does the json look ok?? if yes uncomment post request stuff 😂")
    #response = requests.post(url, headers=headers, data=json.dumps(payload_array))
    #response.raise_for_status()
    print("##################")
    #print(json.dumps(response.json()))


# Usage
update_localizations_from_excel('puuttuvat_kaannokset.xlsx')
