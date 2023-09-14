import { Exam } from '../../../../types'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tabs } from '../../../Tabs'
import { FavoriteContentList } from './FavoriteContentList'
import { useParams } from 'react-router-dom'

export const AssignmentFavorite = () => {
  const { t } = useTranslation()
  const { exam } = useParams<{ exam: Exam }>()

  const [activeTab, setActiveTab] = useState<Exam>(exam || Exam.Suko)

  return (
    <div className="pt-3">
      <h2 className="mb-3" data-testid="favorite-page-heading">
        {t('favorite.suosikkitehtavat')}
      </h2>

      <Tabs
        options={Object.values(Exam).map((it) => it.toLowerCase())}
        activeTab={activeTab.toLowerCase()}
        setActiveTab={(opt) => setActiveTab(opt.toUpperCase() as Exam)}
      />

      <div role="tabpanel">{activeTab && <FavoriteContentList activeTab={activeTab} />}</div>
    </div>
  )
}
