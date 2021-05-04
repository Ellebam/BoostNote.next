import {
  mdiApplicationCog,
  mdiArchive,
  mdiFileDocumentOutline,
  mdiFolderPlusOutline,
  mdiLock,
  mdiPencil,
  mdiTextBoxPlusOutline,
  mdiTrashCanOutline,
} from '@mdi/js'
import {
  FolderDoc,
  NoteDoc,
  NoteStorage,
  ObjectMap,
  PopulatedFolderDoc,
} from '../../../db/types'
import {
  getFolderHref,
  getFolderId,
  getFolderNameFromPathname,
  getFolderPathname,
  getNoteHref,
  getNoteTitle,
  getParentFolderPathname,
  getStorageHref,
} from '../../../db/utils'
import { LocalNewResourceRequestBody } from '../../hooks/local/useLocalUI'
import { FormRowProps } from '../../../../shared/components/molecules/Form'
import { TopbarBreadcrumbProps } from '../../../../shared/components/organisms/Topbar'
import { topParentId } from '../../../../cloud/lib/mappers/topbarTree'

type AddedProperties =
  | { type: 'folder'; item: FolderDoc }
  | { type: 'note'; item: NoteDoc }
  | { type: 'storage'; item: NoteStorage }
  | { type: undefined; item: undefined }

export function mapTopbarBreadcrumbs(
  foldersMap: ObjectMap<FolderDoc>,
  storage: NoteStorage,
  push: (url: string) => void,
  {
    pageNote,
    pageFolder,
  }: {
    pageNote?: NoteDoc
    pageFolder?: PopulatedFolderDoc
  },
  renameFolder?: (storageId: string, folder: FolderDoc) => void,
  renameNote?: (storageId: string, note: NoteDoc) => void,
  openNewDocForm?: (
    body: LocalNewResourceRequestBody,
    prevRows?: FormRowProps[]
  ) => void,
  openNewFolderForm?: (
    body: LocalNewResourceRequestBody,
    prevRows?: FormRowProps[]
  ) => void,
  editWorkspace?: (storage: NoteStorage) => void,
  deleteOrTrashNote?: (
    storageId: string,
    noteId: string,
    trashed?: boolean
  ) => Promise<void>,
  deleteFolder?: (storageName: string, folder: FolderDoc) => void,
  deleteWorkspace?: (storage: NoteStorage) => void
) {
  const items: (TopbarBreadcrumbProps & AddedProperties)[] = []

  let parent:
    | { type: 'folder'; item?: FolderDoc }
    | { type: 'storage'; item?: NoteStorage }
    | undefined

  if (pageNote != null) {
    const parentFolderDoc = foldersMap[pageNote.folderPathname]
    parent =
      parentFolderDoc != null && pageNote.folderPathname != '/'
        ? { type: 'folder', item: parentFolderDoc }
        : { type: 'storage', item: storage }
    items.unshift(
      getDocBreadcrumb(
        storage.id,
        pageNote,
        true,
        push,
        renameNote,
        deleteOrTrashNote
      )
    )
  }

  if (pageFolder != null) {
    const parentFolderPathname = getParentFolderPathname(
      getFolderPathname(pageFolder._id)
    )
    const parentFolderDoc = foldersMap[parentFolderPathname]
    parent =
      parentFolderDoc != null && parentFolderPathname != '/'
        ? { type: 'folder', item: parentFolderDoc }
        : { type: 'storage', item: storage }
    const pageFolderPathname = getFolderPathname(pageFolder._id)
    if (pageFolderPathname != '/') {
      items.unshift(
        getFolderBreadcrumb(
          pageFolder,
          storage,
          push,
          openNewDocForm,
          openNewFolderForm,
          renameFolder,
          deleteFolder
        )
      )
    }
  }

  let reversedToTop = false

  while (!reversedToTop) {
    if (parent == null) {
      break
    }

    const addedProperties: AddedProperties & { href: string } =
      parent.item == null
        ? {
            href: '/app/storages/',
            type: undefined,
            item: undefined,
          }
        : parent.type === 'folder'
        ? {
            href: getFolderHref(parent.item, storage.id),
            type: 'folder',
            item: parent.item,
          }
        : {
            href: getStorageHref(parent.item),
            type: 'storage',
            item: parent.item,
          }

    if (parent.item == null) {
      items.unshift({
        label: '..',
        parentId: topParentId,
        ...addedProperties,
        link: {
          href: addedProperties.href,
          navigateTo: () => push(addedProperties.href),
        },
        controls: [],
      })
    } else {
      if (parent.type === 'folder') {
        items.unshift(
          getFolderBreadcrumb(
            parent.item,
            storage,
            push,
            openNewDocForm,
            openNewFolderForm,
            renameFolder,
            deleteFolder
          )
        )
      } else {
        items.unshift(
          mapStorageBreadcrumb(
            parent.item,
            push,
            openNewDocForm,
            openNewFolderForm,
            editWorkspace,
            deleteWorkspace
          )
        )
      }
    }

    if (parent.type === 'storage') {
      reversedToTop = true
    } else {
      if (parent.item == null) {
        parent = undefined
      } else {
        const folderPathname = getFolderPathname(parent.item._id)
        const parentFolderPathname = getParentFolderPathname(folderPathname)
        const parentFolderDoc = foldersMap[parentFolderPathname]
        parent =
          parentFolderDoc != null && parentFolderPathname != '/'
            ? { type: 'folder', item: parentFolderDoc }
            : {
                type: 'storage',
                item: storage,
              }
      }
    }
  }

  return items
}

function getDocBreadcrumb(
  storageId: string,
  note: NoteDoc,
  active: boolean,
  push: (url: string) => void,
  renameNote?: (storageId: string, note: NoteDoc) => void,
  deleteOrTrashNote?: (
    storageId: string,
    noteId: string,
    trashed?: boolean
  ) => void
): TopbarBreadcrumbProps & AddedProperties {
  const parentFolderId = getFolderId(note.folderPathname)
  return {
    label: getNoteTitle(note, 'Untitled'),
    active,
    parentId: getUnsignedId(storageId, parentFolderId),
    icon: mdiFileDocumentOutline,
    emoji: undefined,
    type: 'note',
    item: note,
    link: {
      href: getNoteHref(note, storageId),
      navigateTo: () => push(getNoteHref(note, storageId)),
    },
    controls: [
      ...(renameNote != null
        ? [
            {
              icon: mdiPencil,
              label: 'Rename',
              onClick: () => {
                renameNote(storageId, note)
              },
            },
          ]
        : []),
      ...(deleteOrTrashNote != null
        ? [
            note.trashed != null
              ? {
                  icon: mdiTrashCanOutline,
                  label: 'Delete',
                  onClick: () => deleteOrTrashNote(storageId, note._id),
                }
              : {
                  icon: mdiArchive,
                  label: 'Archive',
                  onClick: () => deleteOrTrashNote(storageId, note._id),
                },
          ]
        : []),
    ],
  }
}

function getFolderBreadcrumb(
  folder: FolderDoc,
  storage: NoteStorage,
  push: (url: string) => void,
  openNewNoteForm?: (
    body: LocalNewResourceRequestBody,
    prevRows?: FormRowProps[]
  ) => void,
  openNewFolderForm?: (
    body: LocalNewResourceRequestBody,
    prevRows?: FormRowProps[]
  ) => void,
  renameFolder?: (storageId: string, folder: FolderDoc) => void,
  deleteFolder?: (storageName: string, folder: FolderDoc) => void
): TopbarBreadcrumbProps & AddedProperties {
  const folderPathname = getFolderPathname(folder._id)
  const parentFolderPathname = getParentFolderPathname(folderPathname)
  const parentFolderId = storage.folderMap[parentFolderPathname]?._id
  const newResourceBody = {
    storageId: storage.id, // folder storage ID (only one)
    parentFolderPathname: parentFolderPathname,
  }
  const currentPath = `${storage.name}${folderPathname}`
  return {
    type: 'folder',
    item: folder,
    label: getFolderNameFromPathname(folderPathname) ?? storage.name,
    active: true,
    parentId: getUnsignedId(storage.id, parentFolderId),
    emoji: undefined,
    link: {
      href: getFolderHref(folder, storage.id),
      navigateTo: () => push(getFolderHref(folder, storage.id)),
    },
    controls: [
      ...(openNewNoteForm != null
        ? [
            {
              icon: mdiTextBoxPlusOutline,
              label: 'Create a document',
              onClick: () =>
                openNewNoteForm(newResourceBody, [
                  {
                    description: currentPath,
                  },
                ]),
            },
          ]
        : []),
      ...(openNewFolderForm != null
        ? [
            {
              icon: mdiFolderPlusOutline,
              label: 'Create a folder',
              onClick: () =>
                openNewFolderForm(newResourceBody, [
                  {
                    description: currentPath,
                  },
                ]),
            },
          ]
        : []),
      ...(renameFolder != null
        ? [
            {
              icon: mdiPencil,
              label: 'Rename',
              onClick: () => renameFolder(storage.id, folder),
            },
          ]
        : []),
      ...(deleteFolder != null
        ? [
            {
              icon: mdiTrashCanOutline,
              label: 'Delete',
              onClick: () => deleteFolder(storage.id, folder),
            },
          ]
        : []),
    ],
  } as TopbarBreadcrumbProps & AddedProperties
}

export function mapStorageBreadcrumb(
  storage: NoteStorage,
  push: (url: string) => void,
  openNewDocForm?: (
    body: LocalNewResourceRequestBody,
    prevRows?: FormRowProps[]
  ) => void,
  openNewFolderForm?: (
    body: LocalNewResourceRequestBody,
    prevRows?: FormRowProps[]
  ) => void,
  editWorkspace?: (storage: NoteStorage) => void,
  deleteWorkspace?: (storage: NoteStorage) => void
): TopbarBreadcrumbProps & AddedProperties {
  const newResourceBody = {
    storageId: storage.id,
  }

  return {
    type: 'storage',
    item: storage,
    label: storage.name,
    active: true,
    icon: mdiLock, // Default workspace Icon/Emoji
    parentId: topParentId,
    link: {
      href: getStorageHref(storage),
      navigateTo: () => push(getStorageHref(storage)),
    },
    controls: [
      ...(openNewDocForm != null
        ? [
            {
              icon: mdiTextBoxPlusOutline,
              label: 'Create a document',
              onClick: () =>
                openNewDocForm(newResourceBody, [
                  {
                    description: storage.name,
                  },
                ]),
            },
          ]
        : []),
      ...(openNewFolderForm != null
        ? [
            {
              icon: mdiFolderPlusOutline,
              label: 'Create a folder',
              onClick: () =>
                openNewFolderForm(newResourceBody, [
                  {
                    description: storage.name,
                  },
                ]),
            },
          ]
        : []),
      ...(editWorkspace != null
        ? [
            {
              icon: mdiApplicationCog,
              label: 'Edit',
              onClick: () => editWorkspace(storage),
            },
          ]
        : []),
      ...(deleteWorkspace != null // !storage.default = one storage - always default?
        ? [
            {
              icon: mdiTrashCanOutline,
              label: 'Delete',
              onClick: () => deleteWorkspace(storage),
            },
          ]
        : []),
    ],
  }
}

function getUnsignedId(fallbackId: string, folderId?: string) {
  if (folderId != null && getFolderPathname(folderId) != '/') {
    return folderId
  }
  return fallbackId
}
