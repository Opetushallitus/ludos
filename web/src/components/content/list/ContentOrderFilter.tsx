import { ContentOrder } from '../../../types'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { LudosSelect } from '../../ludosSelect/LudosSelect'
import { currentKoodistoSelectOption, koodistoSelectOptions } from '../../ludosSelect/helpers'
import { sortKooditByArvo } from '../../../hooks/useKoodisto'

type ContentOrderFilterProps = {
  contentOrder: ContentOrder
  setContentOrder: (contentOrder: ContentOrder) => void
}

export const ContentOrderFilter = ({ contentOrder, setContentOrder }: ContentOrderFilterProps) => {
  const { t, ORDER_OPTIONS } = useLudosTranslation()

  return (
    <div className="flex flex-col gap-2 md:flex-row">
      <p className="mt-2">{t('filter.jarjesta')}</p>
      <LudosSelect
        name="orderFilter"
        options={koodistoSelectOptions(sortKooditByArvo(ORDER_OPTIONS))}
        value={currentKoodistoSelectOption(contentOrder, ORDER_OPTIONS)}
        onChange={(opt) => setContentOrder(opt!.value as ContentOrder)}
        className="w-40"
      />
    </div>
  )
}
