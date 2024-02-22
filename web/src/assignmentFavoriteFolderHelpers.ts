import { FavoriteCardFolderDtoOut, FavoriteIdsDtoOut } from './types'
import { FolderList } from './components/modal/AssignmentFavoriteMoveFolderModal'

export function findCurrentData(
  currentFolderId?: string,
  data?: FavoriteCardFolderDtoOut
): FavoriteCardFolderDtoOut | null {
  if (!data) {
    return null
  }

  if (!currentFolderId || data.id === Number(currentFolderId)) {
    return data
  }

  for (const subfolder of data.subfolders) {
    const foundFolder = findCurrentData(currentFolderId, subfolder)
    if (foundFolder) {
      return foundFolder
    }
  }

  return null
}

export function findFoldersWithAssignment(folder: FavoriteCardFolderDtoOut, assignmentId: number): number[] {
  const hasAssignment = folder.assignmentCards.some((assignment) => assignment.id === assignmentId)

  return folder.subfolders.reduce(
    (acc, subfolder) => acc.concat(findFoldersWithAssignment(subfolder, assignmentId)),
    hasAssignment ? [folder.id] : []
  )
}

export function findParentFolder(folder: FavoriteCardFolderDtoOut, folderId: number): number {
  if (folder.subfolders.some((subfolder) => subfolder.id === folderId)) {
    return folder.id
  }

  for (const subfolder of folder.subfolders) {
    const parent = findParentFolder(subfolder, folderId)
    if (parent !== -1) {
      return parent
    }
  }

  return -1
}

export function findFolderPathTo(
  rootFolder: FavoriteCardFolderDtoOut,
  targetFolderId: number,
  path: FolderList = []
): FolderList {
  if (rootFolder.id === targetFolderId) {
    return [...path, { id: rootFolder.id, name: rootFolder.name }]
  }

  for (const subfolder of rootFolder.subfolders) {
    const result = findFolderPathTo(subfolder, targetFolderId, [...path, { id: rootFolder.id, name: rootFolder.name }])
    if (result.length > 0) {
      return result
    }
  }

  return []
}

export function makeFlatListFromFolder(folder: FavoriteCardFolderDtoOut): FolderList {
  return folder.subfolders.reduce(
    (acc, subfolder) => {
      return [...acc, ...makeFlatListFromFolder(subfolder)]
    },
    [{ id: folder.id, name: folder.name }]
  )
}

export function folderIdsByAssignmentId(
  favoriteCardFolder: FavoriteCardFolderDtoOut,
  accumulator: { [key: number]: number[] }
): { [key: number]: number[] } {
  for (const assignmentCard of favoriteCardFolder.assignmentCards) {
    if (!accumulator[assignmentCard.id]) {
      accumulator[assignmentCard.id] = []
    }
    accumulator[assignmentCard.id].push(favoriteCardFolder.id)
  }
  for (const subfolder of favoriteCardFolder.subfolders) {
    folderIdsByAssignmentId(subfolder, accumulator)
  }
  return accumulator
}

export function favoriteIdsFromFavoriteCardFolders(favoriteCardFolders: FavoriteCardFolderDtoOut): FavoriteIdsDtoOut {
  return {
    rootFolder: favoriteCardFolders,
    folderIdsByAssignmentId: folderIdsByAssignmentId(favoriteCardFolders, {})
  }
}
