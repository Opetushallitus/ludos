import { getKoodi, KoodiDtoOut, oppimaaraLabel } from '../../hooks/useKoodisto'
import { LudosSelectOption } from './LudosSelect'
import { KoodistoName, Oppimaara, oppimaaraId } from '../../types'

export function koodistoSelectOptions(koodiList: KoodiDtoOut[]): LudosSelectOption[] {
  return koodiList.flatMap((k) => ({ value: k.koodiArvo, label: k.nimi }))
}

export function currentKoodistoSelectOption(
  selectedOption: string | null,
  koodisto: Record<string, KoodiDtoOut>
): LudosSelectOption | null {
  if (selectedOption === null) {
    return null
  }
  const koodi = getKoodi(selectedOption, koodisto)
  return koodi
    ? {
        value: selectedOption,
        label: koodi.nimi
      }
    : null
}

export function currentKoodistoSelectOptions(
  selectedOptions: string[] | null,
  koodisto: Record<string, KoodiDtoOut>
): LudosSelectOption[] | null {
  if (!selectedOptions) {
    return null
  }

  return selectedOptions
    .map((o) => currentKoodistoSelectOption(o, koodisto))
    .filter((o: LudosSelectOption | null): o is LudosSelectOption => o !== null)
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function oppimaaraSelectOptions(
  oppimaaras: Oppimaara[],
  getKoodiLabel: (koodiArvo: string, koodistoName: KoodistoName) => string
): LudosSelectOption[] {
  interface OppimaaraWithLabels extends Oppimaara {
    oppimaaraKoodiArvoLabel: string
    kielitarjontaKoodiArvoLabel: string | null
  }

  const addLabelsToOppimaara = (o: Oppimaara): OppimaaraWithLabels => ({
    oppimaaraKoodiArvo: o.oppimaaraKoodiArvo,
    oppimaaraKoodiArvoLabel: getKoodiLabel(o.oppimaaraKoodiArvo, 'oppiaineetjaoppimaaratlops2021'),
    kielitarjontaKoodiArvo: o.kielitarjontaKoodiArvo,
    kielitarjontaKoodiArvoLabel: o.kielitarjontaKoodiArvo
      ? getKoodiLabel(o.kielitarjontaKoodiArvo, 'lukiokielitarjonta')
      : null
  })
  const sortOppimaarasWithLabels = (a: OppimaaraWithLabels, b: OppimaaraWithLabels) => {
    const oppimaaraOrder = a.oppimaaraKoodiArvoLabel.localeCompare(b.oppimaaraKoodiArvoLabel)
    if (oppimaaraOrder === 0 && a.kielitarjontaKoodiArvoLabel && b.kielitarjontaKoodiArvoLabel) {
      // two children of the same parent oppimaara
      return a.kielitarjontaKoodiArvoLabel.localeCompare(b.kielitarjontaKoodiArvoLabel)
    } else if (oppimaaraOrder === 0 && (a.kielitarjontaKoodiArvoLabel || b.kielitarjontaKoodiArvoLabel)) {
      // one parent and one child, always sort parent before child
      return a.kielitarjontaKoodiArvoLabel ? 1 : -1
    } else if (oppimaaraOrder === 0 && !a.kielitarjontaKoodiArvoLabel && !b.kielitarjontaKoodiArvoLabel) {
      // two equal parent oppimaaras, should be unreachable
      return 0
    } else {
      // two different parent oppimaaras
      return oppimaaraOrder
    }
  }
  const selectOptionFromOppimaaraWithLabels = (o: OppimaaraWithLabels) => ({
    value: oppimaaraId(o),
    label: oppimaaraLabel(o.oppimaaraKoodiArvoLabel, o.kielitarjontaKoodiArvoLabel)
  })

  return oppimaaras
    .map(addLabelsToOppimaara)
    .toSorted(sortOppimaarasWithLabels)
    .map(selectOptionFromOppimaaraWithLabels)
}
export function currentOppimaaraSelectOption(
  selectedOppimaaraOption: Oppimaara | undefined,
  getOppimaaraLabel: (oppimaara: Oppimaara) => string
): LudosSelectOption | null {
  if (!selectedOppimaaraOption) {
    return null
  }

  return {
    value: oppimaaraId(selectedOppimaaraOption),
    label: getOppimaaraLabel(selectedOppimaaraOption)
  }
}

export function currentOppimaaraSelectOptions(
  selectedOppimaaraOptions: Oppimaara[] | undefined,
  getOppimaaraLabel: (oppimaara: Oppimaara) => string
): LudosSelectOption[] {
  if (!selectedOppimaaraOptions) {
    return []
  }

  return selectedOppimaaraOptions.map((o) => currentOppimaaraSelectOption(o, getOppimaaraLabel)!)
}
