import { useFormContext } from 'react-hook-form'
import { FavoriteFolderDtoOut } from '../../../types'
import { FavoriteToggleModalFormType } from './favoriteToggleModalFormSchema'
import { useTranslation } from 'react-i18next'
import { FAVORITE_ROOT_FOLDER_ID } from '../../../constants'

type FavoriteFolderCheckboxesProps = {
  folders: FavoriteFolderDtoOut[]
  prefix?: string
}

export const FavoriteFolderCheckboxes = ({ folders = [], prefix = '' }: FavoriteFolderCheckboxesProps) => {
  const { t } = useTranslation()
  const { setValue, getValues, watch } = useFormContext<FavoriteToggleModalFormType>()

  const handleCheckboxChange = (folderId: number) => {
    const currentValues = getValues('favoriteFolderIds') || []
    setValue(
      'favoriteFolderIds',
      currentValues.includes(folderId) ? currentValues.filter((id) => id !== folderId) : [...currentValues, folderId]
    )
  }

  const watchAddToFolderIds = watch('favoriteFolderIds') || []

  return (
    <>
      {folders.map(({ id, name, subfolders }, i) => (
        <div key={i} className="flex flex-wrap pl-4 w-full">
          <input
            type="checkbox"
            id={`folder-${prefix}${id}`}
            value={id}
            onChange={() => handleCheckboxChange(id)}
            checked={watchAddToFolderIds.includes(id)}
            data-testid={`option-${id}`}
          />
          <label className="pl-2" htmlFor={`folder-${prefix}${id}`}>
            {id === FAVORITE_ROOT_FOLDER_ID ? t('favorite.suosikkien-paataso') : name}
          </label>

          {subfolders && subfolders.length > 0 && (
            <FavoriteFolderCheckboxes folders={subfolders} prefix={`${prefix}${id}-`} />
          )}
        </div>
      ))}
    </>
  )
}
