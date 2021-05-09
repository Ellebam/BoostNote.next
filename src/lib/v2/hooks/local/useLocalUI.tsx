import React, { useCallback } from 'react'
import { mdiFileDocumentOutline, mdiFolderOutline, mdiPencil } from '@mdi/js'
import { FolderDoc, NoteDoc, NoteStorage } from '../../../db/types'
import { useDb } from '../../../db'
import {
  getFolderNameFromPathname,
  getFolderPathname,
  getNoteTitle,
  getParentFolderPathname,
} from '../../../db/utils'
import { join } from 'path'
import BasicInputFormLocal from '../../../../components/v2/organisms/BasicInputFormLocal'
import { FormRowProps } from '../../../../shared/components/molecules/Form'
import { useModal } from '../../../../shared/lib/stores/modal'
import {
  DialogIconTypes,
  useDialog,
} from '../../../../shared/lib/stores/dialog'
import { useToast } from '../../../../shared/lib/stores/toast'
import { useGeneralStatus } from '../../../generalStatus'

export function useLocalUI() {
  const { openSideNavFolderItemRecursively } = useGeneralStatus()
  const { openModal, closeLastModal } = useModal()
  const { messageBox } = useDialog()
  const {
    updateNote,
    createNote,
    createFolder,
    renameFolder,
    removeFolder,
    trashNote,
    purgeNote,
    renameStorage,
  } = useDb()
  const { pushMessage } = useToast()

  const openWorkspaceEditForm = useCallback(
    (storage: NoteStorage) => {
      openModal(
        <BasicInputFormLocal
          defaultIcon={mdiFolderOutline}
          defaultInputValue={storage != null ? storage.name : 'Untitled'}
          defaultEmoji={undefined}
          placeholder='Storage name'
          submitButtonProps={{
            label: 'Update',
          }}
          onSubmit={async (storageName: string) => {
            if (storageName == '') {
              pushMessage({
                title: 'Cannot rename storage',
                description: 'Storage name should not be empty.',
              })
            }
            await renameStorage(storage.id, storageName)
            closeLastModal()
          }}
        />,
        {
          showCloseIcon: true,
          size: 'default',
          title: 'Rename storage',
        }
      )
    },
    [closeLastModal, openModal, pushMessage, renameStorage]
  )

  const openRenameFolderForm = useCallback(
    (storageId: string, folder: FolderDoc) => {
      const folderPathname = getFolderPathname(folder._id)
      const folderName = getFolderNameFromPathname(folderPathname)
      openModal(
        <BasicInputFormLocal
          defaultIcon={mdiFolderOutline}
          defaultInputValue={folderName != null ? folderName : 'Untitled'}
          defaultEmoji={undefined}
          placeholder='Folder name'
          submitButtonProps={{
            label: 'Update',
          }}
          onSubmit={async (folderName: string) => {
            if (folderName == '') {
              pushMessage({
                title: 'Cannot rename folder',
                description: 'Folder name should not be empty.',
              })
            }
            const newFolderPathname = join(
              getParentFolderPathname(folderPathname),
              folderName
            )
            await renameFolder(
              storageId,
              folderPathname,
              newFolderPathname
            ).catch((err) => {
              pushMessage({
                title: 'Cannot rename folder',
                description:
                  err != null
                    ? err.message != null
                      ? err.message
                      : `${err}`
                    : 'Unknown error',
              })
            })

            // Should update the UI, again works weirdly in pouch DB, works ok in FS storage but opens folder?
            // does not update the note properly?
            // push(`/app/storages/${storageId}/notes${newFolderPathname}`)
            openSideNavFolderItemRecursively(storageId, newFolderPathname)
            closeLastModal()
          }}
        />,
        {
          showCloseIcon: true,
          size: 'default',
          title: 'Rename folder',
        }
      )
    },
    [
      openModal,
      renameFolder,
      closeLastModal,
      openSideNavFolderItemRecursively,
      pushMessage,
    ]
  )

  const openRenameNoteForm = useCallback(
    (storageId: string, note: NoteDoc) => {
      openModal(
        <BasicInputFormLocal
          defaultIcon={mdiFileDocumentOutline}
          defaultInputValue={getNoteTitle(note, 'Untitled')}
          defaultEmoji={mdiPencil}
          placeholder='Note title'
          submitButtonProps={{
            label: 'Update',
          }}
          inputIsDisabled={false}
          onSubmit={async (inputValue: string) => {
            await updateNote(storageId, note._id, { title: inputValue })
            closeLastModal()
          }}
        />,
        {
          showCloseIcon: true,
          size: 'default',
          title: 'Rename note',
        }
      )
    },
    [closeLastModal, openModal, updateNote]
  )

  const openNewFolderForm = useCallback(
    (body: LocalNewResourceRequestBody, prevRows?: FormRowProps[]) => {
      openModal(
        <BasicInputFormLocal
          defaultIcon={mdiFolderOutline}
          placeholder='Folder name'
          submitButtonProps={{
            label: 'Create',
          }}
          prevRows={prevRows}
          onSubmit={async (inputValue: string) => {
            if (body.storageId == null) {
              return
            }

            try {
              if (inputValue.endsWith('/')) {
                inputValue = inputValue.slice(0, inputValue.length - 1)
              }
              const folderPathname = join(
                body.parentFolderPathname != null
                  ? body.parentFolderPathname
                  : '/',
                inputValue
              )
              await createFolder(body.storageId, folderPathname)
            } finally {
              closeLastModal()
            }
          }}
        />,
        {
          showCloseIcon: true,
          size: 'default',
          title: 'Create new folder',
        }
      )
    },
    [openModal, createFolder, closeLastModal]
  )

  const openNewDocForm = useCallback(
    (body: LocalNewResourceRequestBody, prevRows?: FormRowProps[]) => {
      openModal(
        <BasicInputFormLocal
          defaultIcon={mdiFileDocumentOutline}
          placeholder='Note title'
          submitButtonProps={{
            label: 'Create',
          }}
          prevRows={prevRows}
          onSubmit={async (inputValue: string) => {
            if (body.storageId == null) {
              return
            }

            await createNote(body.storageId, {
              title: inputValue,
              folderPathname:
                body.parentFolderPathname != null
                  ? body.parentFolderPathname
                  : '/',
            })
            closeLastModal()
          }}
        />,
        {
          showCloseIcon: true,
          size: 'default',
          title: 'Create new note',
        }
      )
    },
    [openModal, createNote, closeLastModal]
  )

  // const deleteWorkspace = useCallback(
  //   async (workspace: { id: string; teamId: string; default: boolean }) => {
  //     if (workspace.default) {
  //       return
  //     }
  //     messageBox({
  //       title: `Delete the workspace?`,
  //       message: `Are you sure to delete this workspace? You will not be able to revert this action.`,
  //       buttons: [
  //         {
  //           variant: 'secondary',
  //           label: 'Cancel',
  //           cancelButton: true,
  //           defaultButton: true,
  //         },
  //         {
  //           variant: 'danger',
  //           label: 'Destroy All',
  //           onClick: async () => await deleteWorkspaceApi(workspace),
  //         },
  //       ],
  //     })
  //   },
  //   [messageBox, deleteWorkspaceApi]
  // )

  const deleteFolder = useCallback(
    async (target: { storageName: string; folder: FolderDoc }) => {
      const folderPathname = getFolderPathname(target.folder._id)
      messageBox({
        title: `Delete folder '${
          folderPathname.startsWith('/')
            ? folderPathname.substr(1)
            : folderPathname
        }'`,
        message: `Are you sure you want to remove this folder and its notes?`,
        iconType: DialogIconTypes.Warning,
        buttons: [
          {
            variant: 'secondary',
            label: 'Cancel',
            cancelButton: true,
            defaultButton: true,
          },
          {
            variant: 'danger',
            label: 'Delete',
            onClick: async () => {
              await removeFolder(target.storageName, folderPathname)
            },
          },
        ],
      })
    },
    [messageBox, removeFolder]
  )

  const deleteOrTrashNote = useCallback(
    async (
      storageId: string,
      noteId: string,
      trashed: boolean,
      title = 'this note'
    ) => {
      if (!trashed) {
        return messageBox({
          title: `Archive ${title}`,
          message: `Are you sure you want to archive this content?`,
          iconType: DialogIconTypes.Warning,
          buttons: [
            {
              variant: 'secondary',
              label: 'Cancel',
              cancelButton: true,
              defaultButton: true,
            },
            {
              variant: 'warning',
              label: 'Archive',
              onClick: async () => {
                await trashNote(storageId, noteId)
              },
            },
          ],
        })
      }
      messageBox({
        title: `Delete ${title}`,
        message: `Are you sure you want to delete this note?`,
        iconType: DialogIconTypes.Warning,
        buttons: [
          {
            variant: 'secondary',
            label: 'Cancel',
            cancelButton: true,
            defaultButton: true,
          },
          {
            variant: 'danger',
            label: 'Delete',
            onClick: async () => {
              await purgeNote(storageId, noteId)
            },
          },
        ],
      })
    },
    [messageBox, purgeNote, trashNote]
  )

  return {
    openWorkspaceEditForm,
    openNewDocForm,
    openNewFolderForm,
    openRenameFolderForm,
    openRenameNoteForm,
    deleteFolder,
    // deleteWorkspace,
    deleteOrTrashNote,
  }
}

export interface LocalNewResourceRequestBody {
  storageId?: string
  parentFolderPathname?: string
}
