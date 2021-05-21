import React, { useCallback, useEffect, useMemo } from 'react'
import path from 'path'
import pathParse from 'path-parse'
import ContentLayout, {
  ContentLayoutProps,
} from '../shared/components/templates/ContentLayout'
import { SidebarState } from '../shared/lib/sidebar'
import { useRouter } from '../lib/router'
import { StorageNotesRouteParams, useRouteParams } from '../lib/routeParams'
import { filenamify } from '../lib/string'
import { usePreferences } from '../lib/preferences'
import { usePreviewStyle } from '../lib/preview'
import { useToast } from '../shared/lib/stores/toast'
import { mapTopBarTree } from '../lib/v2/mappers/local/topbarTree'
import { useDb } from '../lib/db'
import { useGeneralStatus } from '../lib/generalStatus'
import { useSearchModal } from '../lib/searchModal'
import {
  addIpcListener,
  getPathByName,
  removeIpcListener,
  showSaveDialog,
  writeFile,
} from '../lib/electronOnly'
import {
  convertNoteDocToPdfBuffer,
  exportNoteAsHtmlFile,
  exportNoteAsMarkdownFile,
} from '../lib/exports'
import SearchModal from './organisms/SearchModal'
import SidebarContainer from './organisms/SidebarContainer'
import ApplicationLayout from '../shared/components/molecules/ApplicationLayout'

interface ApplicationProps {
  content: ContentLayoutProps
  className?: string
  initialSidebarState?: SidebarState
}

const Application = ({
  content: { topbar, ...content },
  children,
  initialSidebarState,
}: React.PropsWithChildren<ApplicationProps>) => {
  const { storageMap } = useDb()
  const routeParams = useRouteParams() as StorageNotesRouteParams
  const { workspaceId } = routeParams
  const storage = storageMap[workspaceId]

  const { push, goBack, goForward } = useRouter()
  const { generalStatus, setGeneralStatus } = useGeneralStatus()
  const { noteViewMode, preferredEditingViewMode } = generalStatus
  const { bookmarkNote, unbookmarkNote } = useDb()
  const { showSearchModal } = useSearchModal()
  const { preferences } = usePreferences()
  const { previewStyle } = usePreviewStyle()
  const { pushMessage } = useToast()

  const note = useMemo(() => {
    if (storage == null) {
      return undefined
    }
    switch (routeParams.name) {
      case 'workspaces.notes': {
        if (routeParams.noteId == null) {
          return undefined
        }
        const note = storage.noteMap[routeParams.noteId]
        if (note == null) {
          return undefined
        }
        if (!note.folderPathname.includes(routeParams.folderPathname)) {
          return undefined
        }
        return note
      }
    }
    return undefined
  }, [
    routeParams.folderPathname,
    routeParams.name,
    routeParams.noteId,
    storage,
  ])

  const noteId = note?._id

  const topbarTree = useMemo(() => {
    if (storage == null) {
      return undefined
    }
    return mapTopBarTree(storage.noteMap, storage.folderMap, storage, push)
  }, [push, storage])

  const bookmark = useCallback(async () => {
    if (noteId == null || storage == null) {
      return
    }
    await bookmarkNote(storage.id, noteId)
  }, [noteId, storage, bookmarkNote])

  const unbookmark = useCallback(async () => {
    if (noteId == null || storage == null) {
      return
    }
    await unbookmarkNote(storage.id, noteId)
  }, [storage, noteId, unbookmarkNote])

  const selectEditMode = useCallback(() => {
    setGeneralStatus({
      noteViewMode: 'edit',
      preferredEditingViewMode: 'edit',
    })
  }, [setGeneralStatus])

  const selectSplitMode = useCallback(() => {
    setGeneralStatus({
      noteViewMode: 'split',
      preferredEditingViewMode: 'split',
    })
  }, [setGeneralStatus])

  const selectPreviewMode = useCallback(() => {
    setGeneralStatus({
      noteViewMode: 'preview',
    })
  }, [setGeneralStatus])

  const togglePreviewMode = useCallback(() => {
    if (noteViewMode === 'preview') {
      if (preferredEditingViewMode === 'edit') {
        selectEditMode()
      } else {
        selectSplitMode()
      }
    } else {
      selectPreviewMode()
    }
  }, [
    noteViewMode,
    preferredEditingViewMode,
    selectEditMode,
    selectSplitMode,
    selectPreviewMode,
  ])

  useEffect(() => {
    addIpcListener('toggle-preview-mode', togglePreviewMode)
    return () => {
      removeIpcListener('toggle-preview-mode', togglePreviewMode)
    }
  }, [togglePreviewMode])

  const toggleSplitEditMode = useCallback(() => {
    if (noteViewMode === 'edit') {
      selectSplitMode()
    } else {
      selectEditMode()
    }
  }, [noteViewMode, selectSplitMode, selectEditMode])

  useEffect(() => {
    addIpcListener('toggle-split-edit-mode', toggleSplitEditMode)
    return () => {
      removeIpcListener('toggle-split-edit-mode', toggleSplitEditMode)
    }
  }, [toggleSplitEditMode])

  const includeFrontMatter = preferences['markdown.includeFrontMatter']

  useEffect(() => {
    const handler = () => {
      if (note == null || storage == null) {
        return
      }
      showSaveDialog({
        properties: ['createDirectory', 'showOverwriteConfirmation'],
        buttonLabel: 'Save',
        defaultPath: path.join(
          getPathByName('home'),
          filenamify(note.title) + '.md'
        ),
        filters: [
          {
            name: 'Markdown',
            extensions: ['md'],
          },
          {
            name: 'HTML',
            extensions: ['html'],
          },
          {
            name: 'PDF',
            extensions: ['pdf'],
          },
        ],
      }).then(async (result) => {
        if (result.canceled || result.filePath == null) {
          return
        }
        const parsedFilePath = pathParse(result.filePath)
        switch (parsedFilePath.ext) {
          case '.html':
            await exportNoteAsHtmlFile(
              parsedFilePath.dir,
              parsedFilePath.name,
              note,
              preferences['markdown.codeBlockTheme'],
              preferences['general.theme'],
              pushMessage,
              storage.attachmentMap,
              previewStyle
            )
            pushMessage({
              title: 'HTML export',
              description: 'HTML file exported successfully.',
            })
            return
          case '.pdf':
            try {
              const pdfBuffer = await convertNoteDocToPdfBuffer(
                note,
                preferences['markdown.codeBlockTheme'],
                preferences['general.theme'],
                pushMessage,
                storage.attachmentMap,
                previewStyle
              )
              await writeFile(result.filePath, pdfBuffer)
            } catch (error) {
              console.error(error)
              pushMessage({
                title: 'PDF export failed',
                description: error.message,
              })
            }
            return
          case '.md':
          default:
            await exportNoteAsMarkdownFile(
              parsedFilePath.dir,
              parsedFilePath.name,
              note,
              storage.attachmentMap,
              includeFrontMatter
            )
            pushMessage({
              title: 'Markdown export',
              description: 'Markdown file exported successfully.',
            })
            return
        }
      })
    }
    addIpcListener('save-as', handler)
    return () => {
      removeIpcListener('save-as', handler)
    }
  }, [
    note,
    includeFrontMatter,
    preferences,
    previewStyle,
    pushMessage,
    storage,
  ])

  const toggleBookmark = useCallback(() => {
    if (note == null) {
      return
    }
    if (note.data.bookmarked) {
      unbookmark()
    } else {
      bookmark()
    }
  }, [note, unbookmark, bookmark])

  useEffect(() => {
    addIpcListener('toggle-bookmark', toggleBookmark)
    return () => {
      removeIpcListener('toggle-bookmark', toggleBookmark)
    }
  })

  return (
    <>
      {storage != null && showSearchModal && <SearchModal storage={storage} />}
      <ApplicationLayout
        sidebar={
          <SidebarContainer
            initialSidebarState={initialSidebarState}
            storage={storage}
          />
        }
        pageBody={
          <>
            <ContentLayout
              {...content}
              topbar={{
                ...topbar,
                tree: topbarTree,
                navigation: {
                  goBack,
                  goForward,
                },
              }}
            >
              {children}
            </ContentLayout>
          </>
        }
      />
    </>
  )
}

export default Application
