import React, {
  useMemo,
  useCallback,
  MouseEventHandler,
  useEffect,
} from 'react'
import { useGeneralStatus } from '../../lib/generalStatus'
import { useDialog, DialogIconTypes } from '../../lib/dialog'
import { useDb } from '../../lib/db'
import { useRouter } from '../../lib/router'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '../../lib/preferences'
import NavigatorItem from '../atoms/NavigatorItem'
import { NoteStorage } from '../../lib/db/types'
import {
  mdiTrashCanOutline,
  mdiPaperclip,
  mdiTextBoxPlusOutline,
  mdiFolderMultiplePlusOutline,
} from '@mdi/js'
import FolderNavigatorFragment from './FolderNavigatorFragment'
import TagListFragment from './TagListFragment'
import NavigatorButton from '../atoms/NavigatorButton'
import { noteDetailFocusTitleInputEventEmitter } from '../../lib/events'
import { useAnalytics, analyticsEvents } from '../../lib/analytics'
import { MenuItemConstructorOptions } from 'electron'
import {
  openContextMenu,
  addIpcListener,
  removeIpcListener,
} from '../../lib/electronOnly'
import FolderNoteNavigatorFragment from './FolderNoteNavigatorFragment'
import { useRouteParams, usePathnameWithoutNoteId } from '../../lib/routeParams'
import NavigatorHeader from '../atoms/NavigatorHeader'
import NavigatorSeparator from '../atoms/NavigatorSeparator'

interface StorageNavigatorFragmentProps {
  storage: NoteStorage
}

const StorageNavigatorFragment = ({
  storage,
}: StorageNavigatorFragmentProps) => {
  const { openSideNavFolderItemRecursively } = useGeneralStatus()
  const { prompt } = useDialog()
  const {
    createNote,
    createFolder,
    renameFolder,
    bookmarkNote,
    unbookmarkNote,
    trashNote,
  } = useDb()
  const { push } = useRouter()
  const { t } = useTranslation()
  const routeParams = useRouteParams()
  const { report } = useAnalytics()
  const { preferences } = usePreferences()
  const storageId = storage.id

  const createNoteInFolderAndRedirect = useCallback(
    async (folderPathname: string) => {
      report(analyticsEvents.createNote)
      const note = await createNote(storage.id, {
        folderPathname,
      })
      if (note == null) {
        return
      }
      push(
        `/app/storages/${storage.id}/notes${
          folderPathname === '/' ? '' : folderPathname
        }/${note._id}`
      )
      noteDetailFocusTitleInputEventEmitter.dispatch()
    },
    [storage.id, createNote, push, report]
  )

  const showPromptToCreateFolder = useCallback(
    (folderPathname: string) => {
      prompt({
        title: 'Create a Folder',
        message: 'Enter the path where do you want to create a folder',
        iconType: DialogIconTypes.Question,
        defaultValue: folderPathname === '/' ? '/' : `${folderPathname}/`,
        submitButtonLabel: 'Create Folder',
        onClose: async (value: string | null) => {
          if (value == null) {
            return
          }
          if (value.endsWith('/')) {
            value = value.slice(0, value.length - 1)
          }
          await createFolder(storage.id, value)

          push(`/app/storages/${storage.id}/notes${value}`)

          openSideNavFolderItemRecursively(storage.id, value)
          report(analyticsEvents.createFolder)
        },
      })
    },
    [
      storage.id,
      prompt,
      createFolder,
      push,
      openSideNavFolderItemRecursively,
      report,
    ]
  )

  useEffect(() => {
    const handler = () => {
      const folderPathname =
        routeParams.name === 'workspaces.notes'
          ? routeParams.folderPathname
          : '/'
      showPromptToCreateFolder(folderPathname)
    }
    addIpcListener('new-folder', handler)
    return () => {
      removeIpcListener('new-folder', handler)
    }
  }, [storageId, routeParams, showPromptToCreateFolder])

  const showPromptToRenameFolder = (folderPathname: string) => {
    prompt({
      title: t('folder.rename'),
      message: t('folder.renameMessage'),
      iconType: DialogIconTypes.Question,
      defaultValue: folderPathname.split('/').pop(),
      submitButtonLabel: t('folder.rename'),
      onClose: async (value: string | null) => {
        const folderPathSplit = folderPathname.split('/')
        if (value == null || value === '' || value === folderPathSplit.pop()) {
          return
        }
        const newPathname = folderPathSplit.join('/') + '/' + value
        await renameFolder(storage.id, folderPathname, newPathname)
        push(`/app/storages/${storage.id}/notes${newPathname}`)
        openSideNavFolderItemRecursively(storage.id, newPathname)
      },
    })
  }

  const generalAppMode = preferences['general.appMode']

  const rootFolderPathname = `/app/storages/${storage.id}/notes`

  const trashcanPagePathname = `/app/storages/${storage.id}/trashcan`
  const trashcanPageIsActive = routeParams.name === 'workspaces.archive'

  const attachmentsPagePathname = `/app/storages/${storage.id}/attachments`
  const attachmentsPageIsActive = routeParams.name === 'workspaces.attachments'

  const createNewNoteInRootFolder = useCallback(() => {
    createNoteInFolderAndRedirect('/')
  }, [createNoteInFolderAndRedirect])

  const createNewFolderInRootFolder = useCallback(() => {
    showPromptToCreateFolder('/')
  }, [showPromptToCreateFolder])

  const openWorkspaceContextMenu: MouseEventHandler = useCallback(
    (event) => {
      event.preventDefault()
      event.stopPropagation()
      const menuItems: MenuItemConstructorOptions[] = [
        {
          type: 'normal',
          label: 'New Note',
          click: createNewNoteInRootFolder,
        },
        {
          type: 'normal',
          label: t('folder.create'),
          click: createNewFolderInRootFolder,
        },
      ]

      openContextMenu({ menuItems })
    },
    [createNewNoteInRootFolder, createNewFolderInRootFolder, t]
  )

  const attachments = useMemo(() => Object.values(storage.attachmentMap), [
    storage.attachmentMap,
  ])
  const trashed = useMemo(
    () => Object.values(storage.noteMap).filter((note) => note!.trashed),
    [storage.noteMap]
  )
  const pathname = usePathnameWithoutNoteId()

  const rootIsActive =
    `/app/storages/${storage.id}/notes` === pathname &&
    routeParams.name === 'workspaces.notes' &&
    routeParams.noteId == null

  return (
    <>
      <NavigatorHeader
        label='Workspace'
        active={rootIsActive}
        onClick={() => push(rootFolderPathname)}
        onContextMenu={openWorkspaceContextMenu}
        control={
          <>
            <NavigatorButton
              onClick={createNewNoteInRootFolder}
              iconPath={mdiTextBoxPlusOutline}
              title='New Note'
            />
            <NavigatorButton
              onClick={createNewFolderInRootFolder}
              iconPath={mdiFolderMultiplePlusOutline}
              title='New Folder'
            />
          </>
        }
      />
      {generalAppMode === 'note' ? (
        <FolderNavigatorFragment
          storage={storage}
          createNoteInFolderAndRedirect={createNoteInFolderAndRedirect}
          showPromptToCreateFolder={showPromptToCreateFolder}
          showPromptToRenameFolder={showPromptToRenameFolder}
        />
      ) : (
        <FolderNoteNavigatorFragment
          storage={storage}
          createNoteInFolderAndRedirect={createNoteInFolderAndRedirect}
          showPromptToCreateFolder={showPromptToCreateFolder}
          showPromptToRenameFolder={showPromptToRenameFolder}
          bookmarkNote={bookmarkNote}
          unbookmarkNote={unbookmarkNote}
          trashNote={trashNote}
        />
      )}

      <NavigatorSeparator />

      <TagListFragment storage={storage} />
      {attachments.length > 0 && (
        <NavigatorItem
          depth={0}
          label={t('general.attachments')}
          iconPath={mdiPaperclip}
          active={attachmentsPageIsActive}
          onClick={() => push(attachmentsPagePathname)}
          onContextMenu={(event) => {
            event.preventDefault()
          }}
        />
      )}
      {trashed.length > 0 && (
        <NavigatorItem
          depth={0}
          label={t('general.archive')}
          iconPath={mdiTrashCanOutline}
          active={trashcanPageIsActive}
          onClick={() => push(trashcanPagePathname)}
          onContextMenu={(event) => {
            event.preventDefault()
            // TODO: Implement context menu(restore all notes)
          }}
        />
      )}
    </>
  )
}

export default StorageNavigatorFragment
