import React, { useCallback } from 'react'
import { mdiFileDocumentOutline, mdiFolderOutline, mdiPencil } from '@mdi/js'
import { FolderDoc, NoteDoc, NoteStorage } from '../../../db/types'
import { useDb } from '../../../db'
import {
  getFolderNameFromPathname,
  getFolderPathname,
  getNoteTitle,
} from '../../../db/utils'
import { join } from 'path'
import BasicInputFormLocal from '../../../../components/v2/organisms/BasicInputFormLocal'
import { FormRowProps } from '../../../../shared/components/molecules/Form'
import { useModal } from '../../../../shared/lib/stores/modal'
import {
  DialogIconTypes,
  useDialog,
} from '../../../../shared/lib/stores/dialog'

export function useLocalUI() {
  const { openModal, closeLastModal } = useModal()
  // todo: see if we can use standard message box from local dialog!
  const { messageBox } = useDialog()
  const {
    updateNote,
    createNote,
    createFolder,
    renameFolder,
    removeFolder,
    trashNote,
    purgeNote,
  } = useDb()

  const openWorkspaceEditForm = useCallback(
    (storage: NoteStorage) => {
      // openModal(<EditWorkspaceModal workspace={wp} />)
      openModal(<div>Not yet implement {storage.name}</div>)
    },
    [openModal]
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
          onSubmit={async (inputValue: string) => {
            await renameFolder(
              storageId,
              folderPathname,
              join(folderPathname, inputValue)
            )
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
    [openModal, renameFolder, closeLastModal]
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
        title: `Delete ${folderPathname}`,
        message: `Are you sure to remove this folder and delete completely its notes`,
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
      trashed?: boolean,
      title = 'this document'
    ) => {
      console.log('Got to message box...', trashed, noteId, title)
      if (trashed != null) {
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
              label: 'archive',
              onClick: async () => {
                await trashNote(storageId, noteId)
              },
            },
          ],
        })
      }
      messageBox({
        title: `Delete ${title}`,
        message: `Are you sure you want to delete this content?`,
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
