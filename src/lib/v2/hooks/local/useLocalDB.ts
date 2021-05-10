import { useCallback } from 'react'
import shortid from 'shortid'
import { useDb } from '../../../db'
import { useRouter } from '../../../router'
import {
  FolderDoc,
  NoteDoc,
  NoteDocEditibleProps,
  NoteStorage,
} from '../../../db/types'
import useBulkApi from '../../../../shared/lib/hooks/useBulkApi'
import { getFolderHref, getNoteHref, getStorageHref } from '../../../db/utils'
import { join } from 'path'

export function useLocalDB() {
  // const { pageDoc, pageFolder, setPartialPageData } = usePage()
  // const {
  //   updateWorkspacesMap,
  //   updateFoldersMap,
  //   updateDocsMap,
  //   updateParentFolderOfDoc,
  //   removeFromWorkspacesMap,
  //   foldersMap,
  //   docsMap,
  //   removeFromDocsMap,
  //   removeFromFoldersMap,
  //   setCurrentPath,
  // } = useNav()
  const {
    createStorage,
    createNote,
    removeStorage,
    createFolder,
    removeFolder,
    trashNote,
    untrashNote,
    purgeNote: deleteNote,
    bookmarkNote,
    unbookmarkNote,
    updateNote,
    renameFolder,
  } = useDb()
  const { push } = useRouter()

  const { sendingMap, send } = useBulkApi()

  const createStorageApi = useCallback(
    async (
      body: CreateStorageRequestBody,
      options: {
        skipRedirect?: boolean
        afterSuccess?: (storage: NoteStorage) => void
      }
    ) => {
      await send(shortid.generate(), 'create', {
        api: () => createStorage(body.name, body.props),
        cb: (storage: NoteStorage) => {
          // updateWorkspacesMap([res.workspace.id, res.workspace])
          if (!options.skipRedirect) {
            push(getStorageHref(storage))
          }
          if (options.afterSuccess != null) {
            options.afterSuccess(storage)
          }
        },
      })
    },
    [createStorage, push, send]
  )

  const createNoteApi = useCallback(
    async (body: CreateNoteRequestBody, afterSuccess?: () => void) => {
      await send(shortid.generate(), 'create', {
        api: () => createNote(body.storageId, body.noteProps),
        cb: (note: NoteDoc) => {
          // updateDocsMap([res.doc.id, res.doc])
          // if (res.doc.parentFolder != null) {
          //   updateParentFolderOfDoc(res.doc)
          // }
          push(getNoteHref(note, body.storageId))
          if (afterSuccess != null) {
            afterSuccess()
          }
        },
      })
    },
    [createNote, push, send]
  )

  const createFolderApi = useCallback(
    async (body: CreateFolderRequestBody, afterSuccess?: () => void) => {
      await send(shortid.generate(), 'create', {
        api: () =>
          createFolder(
            body.storageName,
            join(body.destinationPathname, body.folderName)
          ),
        cb: (folder: FolderDoc) => {
          push(getFolderHref(folder, body.storageId))
          if (afterSuccess != null) {
            afterSuccess()
          }
        },
      })
    },
    [createFolder, push, send]
  )

  const toggleNoteTrashed = useCallback(
    async (storageId: string, noteId: string, trashed: boolean) => {
      await send(noteId, 'trash', {
        api: () => {
          if (trashed) {
            return untrashNote(storageId, noteId)
          } else {
            return trashNote(storageId, noteId)
          }
        },
        cb: (res) => {
          console.log('Trashed note...', res)
          // updateDocsMap([res.doc.id, res.doc])
          // if (pageDoc != null && res.doc.id === pageDoc.id) {
          //   setPartialPageData({ pageDoc: res.doc })
          // }
        },
      })
    },
    [send, trashNote, untrashNote]
  )

  const toggleNoteBookmark = useCallback(
    async (storageId: string, noteId: string, bookmarked: boolean) => {
      await send(noteId, 'bookmark', {
        api: () => {
          if (bookmarked) {
            return unbookmarkNote(storageId, noteId)
          } else {
            return bookmarkNote(storageId, noteId)
          }
        },
        cb: (res) => {
          console.log('Bookmarked note...', res)
          // updateDocsMap([res.doc.id, res.doc])
          // if (pageDoc != null && res.doc.id === pageDoc.id) {
          //   setPartialPageData({ pageDoc: res.doc })
          // }
        },
      })
    },
    [bookmarkNote, send, unbookmarkNote]
  )

  const deleteStorageApi = useCallback(
    async (storage: NoteStorage) => {
      await send(storage.id, 'delete', {
        api: () => removeStorage(storage.id),
        cb: (res) => {
          console.log('Removed storage...', res)
        },
      })
    },
    [send, removeStorage]
  )

  const deleteFolderApi = useCallback(
    async (target: {
      storageId: string
      storageName: string
      pathname: string
    }) => {
      await send(target.storageId, 'delete', {
        api: () => removeFolder(target.storageName, target.pathname),
        cb: (res) => {
          console.log('Removed folder...', res)
        },
      })
    },
    [send, removeFolder]
  )

  const deleteNoteApi = useCallback(
    async (target: { storageId: string; noteId: string }) => {
      return send(target.storageId, 'delete', {
        api: () => deleteNote(target.storageId, target.noteId),
        cb: () => {
          console.log('Removed note...', target.noteId)
        },
      })
    },
    [send, deleteNote]
  )

  const updateFolderApi = useCallback(
    async (target: FolderDoc, body: UpdateFolderRequestBody) => {
      await send(target._id, 'update', {
        api: () =>
          // not available, should add upsert folder props or find it?
          renameFolder(body.storageName, body.oldPathname, body.newPathname),
        cb: () => {
          console.log('Updated folder...', target._id, body)
        },
      })
    },
    [send, renameFolder]
  )

  const updateNoteApi = useCallback(
    async (target: NoteDoc, body: UpdateNoteRequestBody) => {
      await send(target._id, 'update', {
        api: () => updateNote(body.storageId, target._id, body.noteProps),
        cb: (note: NoteDoc) => {
          console.log('Updated note...', note)
          // if (pageDoc != null && doc.id === pageDoc.id) {
          //   setPartialPageData({ pageDoc: doc })
          //   setCurrentPath(doc.folderPathname)
          // }
        },
      })
    },
    [send, updateNote]
  )

  return {
    sendingMap,
    createStorageApi,
    createNote: createNoteApi,
    createFolder: createFolderApi,
    toggleNoteTrashed,
    toggleNoteBookmark,
    deleteStorageApi,
    deleteFolderApi,
    deleteNoteApi,
    updateNote: updateNoteApi,
    updateFolder: updateFolderApi,
  }
}

export type CreateFolderRequestBody = {
  storageId: string
  storageName: string
  destinationPathname: string
  folderName: string
}

export type CreateNoteRequestBody = {
  storageId: string
  noteProps: Partial<NoteDocEditibleProps>
}

export type CreateStorageRequestBody = {
  name: string
  props?: { type: 'fs'; location: string }
}

export interface UpdateFolderRequestBody {
  storageName: string
  oldPathname: string
  newPathname: string
}

export interface UpdateNoteRequestBody {
  storageId: string
  noteProps: Partial<NoteDoc>
}
