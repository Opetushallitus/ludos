import { Controller, FormProvider, useForm } from 'react-hook-form'
import { FAVORITE_ROOT_FOLDER_ID } from '../../../constants'
import { AddToFavoriteOptions, AssignmentCardOut, FavoriteIdsDtoOut } from '../../../types'
import { twJoin } from 'tailwind-merge'
import { TextInput } from '../../TextInput'
import { FormError } from '../../forms/formCommon/FormErrors'
import { Button } from '../../Button'
import {
  favoriteToggleModalFormDefaultValues,
  favoriteToggleModalFormSchema,
  FavoriteToggleModalFormType
} from './favoriteToggleModalFormSchema'
import { createFavoriteFolder } from '../../../request'
import { zodResolver } from '@hookform/resolvers/zod'
import { useLudosTranslation } from '../../../hooks/useLudosTranslation'
import { FavoriteFolderCheckboxes } from './FavoriteFolderCheckboxes'

type FavoriteFormProps = {
  isFavorite: boolean
  assignmentCard: AssignmentCardOut
  favoriteIds: FavoriteIdsDtoOut
  onClose: () => void
  onSetFavoriteFoldersAction: (data: FavoriteToggleModalFormType) => void
}

export const FavoriteForm = ({
  isFavorite,
  assignmentCard: { exam, id: assignmentId },
  favoriteIds,
  onClose,
  onSetFavoriteFoldersAction
}: FavoriteFormProps) => {
  const { t, lt } = useLudosTranslation()

  const methods = useForm<FavoriteToggleModalFormType>({
    defaultValues: {
      ...favoriteToggleModalFormDefaultValues(exam, assignmentId),
      addOptions: isFavorite ? AddToFavoriteOptions.FOLDER : AddToFavoriteOptions.FAVORITES,
      favoriteFolderIds: favoriteIds.folderIdsByAssignmentId[assignmentId]
    },
    resolver: zodResolver(favoriteToggleModalFormSchema)
  })

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = methods

  const onSubmit = async () =>
    await handleSubmit(async (data: FavoriteToggleModalFormType) => {
      if (data.addOptions === AddToFavoriteOptions.NEW_FOLDER) {
        const idOfNewFolder = await createFavoriteFolder(exam, data.newFolderName, 0)
        onSetFavoriteFoldersAction({ ...data, favoriteFolderIds: [idOfNewFolder] })
      } else if (data.addOptions === AddToFavoriteOptions.FAVORITES) {
        onSetFavoriteFoldersAction({
          ...data,
          favoriteFolderIds: [FAVORITE_ROOT_FOLDER_ID]
        })
      } else {
        onSetFavoriteFoldersAction(data)
      }
    })()

  const checkboxOptions: {
    type: AddToFavoriteOptions
    text: string
  }[] = [
    { type: AddToFavoriteOptions.FAVORITES, text: lt.checkboxOptionTexts[AddToFavoriteOptions.FAVORITES] },
    { type: AddToFavoriteOptions.FOLDER, text: lt.checkboxOptionTexts[AddToFavoriteOptions.FOLDER] },
    { type: AddToFavoriteOptions.NEW_FOLDER, text: lt.checkboxOptionTexts[AddToFavoriteOptions.NEW_FOLDER] }
  ]

  const watchAddOptions = watch('addOptions')
  const folderNameError = errors.newFolderName?.message

  const filterOptionsIfNoSubFolders = ({ type }: { type: AddToFavoriteOptions }): boolean =>
    favoriteIds.rootFolder.subfolders.length === 0 ? type !== AddToFavoriteOptions.FOLDER : true

  return (
    <div>
      <FormProvider {...methods}>
        <form className="px-4" onSubmit={(e) => e.preventDefault()}>
          {isFavorite ? (
            <FavoriteFolderCheckboxes
              folders={[
                {
                  ...favoriteIds.rootFolder,
                  id: FAVORITE_ROOT_FOLDER_ID,
                  name: t('favorite.suosikkien-paataso')
                }
              ]}
            />
          ) : (
            <Controller
              control={control}
              name="addOptions"
              render={({ field }) => (
                <>
                  {checkboxOptions.filter(filterOptionsIfNoSubFolders).map(({ type, text }, i) => (
                    <div key={i}>
                      <fieldset className="flex items-center">
                        <input
                          type="radio"
                          {...field}
                          value={type}
                          checked={field.value === type}
                          id={type}
                          className="mr-2"
                          data-testid={`radio-${i}`}
                          onChange={(e) => {
                            field.onChange(e)
                            if (e.target.value === AddToFavoriteOptions.FOLDER) {
                              setValue('newFolderName', '')
                            } else if (e.target.value === AddToFavoriteOptions.NEW_FOLDER) {
                              setValue('favoriteFolderIds', [])
                            }
                          }}
                        />
                        <label htmlFor={type}>{text}</label>
                      </fieldset>
                      {type === AddToFavoriteOptions.FOLDER && (
                        <div
                          className={twJoin('pl-6', watchAddOptions === AddToFavoriteOptions.FOLDER ? '' : 'hidden')}>
                          <FavoriteFolderCheckboxes folders={[favoriteIds.rootFolder]} prefix={`root-${i}`} />
                        </div>
                      )}

                      {watchAddOptions === AddToFavoriteOptions.NEW_FOLDER &&
                        type === AddToFavoriteOptions.NEW_FOLDER && (
                          <div className="px-4">
                            <TextInput id="newFolderName" register={register} error={folderNameError} className="mt-0">
                              {t('favorite.kansion-nimi')}
                            </TextInput>
                            <FormError error={folderNameError} name="newFolderName" />
                          </div>
                        )}
                    </div>
                  ))}
                </>
              )}
            />
          )}
        </form>
      </FormProvider>

      <div className="border-b border-gray-separator py-2" />

      <div className="m-6 flex justify-end gap-5">
        <Button variant="buttonGhost" onClick={onClose} data-testid="modal-button-cancel">
          {t('common.peruuta')}
        </Button>
        <Button variant="buttonPrimary" onClick={onSubmit} data-testid="modal-button-add-to-favorites">
          {isFavorite ? t('favorite.tallenna-valinnat') : t('favorite.lisaa-suosikiksi')}
        </Button>
      </div>
    </div>
  )
}
