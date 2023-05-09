import { createContext } from 'react'

type LudosKoodistos =
  | 'oppiaineetjaoppimaaratlops2021'
  | 'laajaalainenosaaminenlops2021'
  | 'ludostehtavatyypi'
  | 'taitotaso'
  | 'ludoslukuvuosi'
  | 'ludoslukiodiplomiaine'

export type KoodiDtoIn = {
  koodiArvo: string
  nimi: string
  kieli: string
}

export type Koodisto = {
  name: LudosKoodistos
  koodit: KoodiDtoIn[]
}

export type KoodistoMap = {
  [key in LudosKoodistos]: Koodisto
}

interface KoodistoContextValue {
  koodistos: KoodistoMap | null
  setKoodistos: (koodistos: KoodistoMap) => void
}

export const KoodistoContext = createContext<KoodistoContextValue>({
  koodistos: null,
  setKoodistos: () => {}
})

export const defaultEmptyKoodisto: KoodistoMap = {
  oppiaineetjaoppimaaratlops2021: {
    name: 'oppiaineetjaoppimaaratlops2021',
    koodit: []
  },
  laajaalainenosaaminenlops2021: {
    name: 'laajaalainenosaaminenlops2021',
    koodit: []
  },
  ludostehtavatyypi: {
    name: 'ludostehtavatyypi',
    koodit: []
  },
  taitotaso: {
    name: 'taitotaso',
    koodit: []
  },
  ludoslukuvuosi: {
    name: 'ludoslukuvuosi',
    koodit: []
  },
  ludoslukiodiplomiaine: {
    name: 'ludoslukiodiplomiaine',
    koodit: []
  }
}
