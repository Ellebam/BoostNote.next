import React, { useCallback, useEffect, useMemo } from 'react'
import styled from '../../lib/styled'
import { NoteDoc, NoteStorage } from '../../lib/db/types'
import {
  mdiViewSplitVertical,
  mdiStarOutline,
  mdiStar,
  mdiPencil,
  mdiChevronRight,
  mdiChevronLeft,
  mdiEyeOutline,
} from '@mdi/js'
import { borderBottom } from '../../lib/styled/styleFunctions'
import { useGeneralStatus } from '../../lib/generalStatus'
import {
  exportNoteAsHtmlFile,
  exportNoteAsMarkdownFile,
  convertNoteDocToPdfBuffer,
} from '../../lib/exports'
import { usePreferences } from '../../lib/preferences'
import { usePreviewStyle } from '../../lib/preview'
import { useTranslation } from 'react-i18next'
import { useDb } from '../../lib/db'
import { useToast } from '../../lib/toast'
import {
  showSaveDialog,
  getPathByName,
  addIpcListener,
  removeIpcListener,
  writeFile,
} from '../../lib/electronOnly'
import path from 'path'
import pathParse from 'path-parse'
import { filenamify } from '../../lib/string'
import Topbar, { TopbarProps } from '../../shared/components/organisms/Topbar'
import { mapTopbarBreadcrumbs } from '../../lib/v2/mappers/local/topbarBreadcrumbs'
import { useRouter } from '../../lib/router'
import { mapTopBarTree } from '../../lib/v2/mappers/local/topbarTree'
import { useLocalUI } from '../../lib/v2/hooks/local/useLocalUI'
import { useRouteParams } from '../../lib/routeParams'

const Container = styled.div`
  display: flex;
  overflow: hidden;
  height: 44px;
  flex-shrink: 0;
  padding: 0 8px;
  ${borderBottom};
  align-items: center;
  & > .left {
    flex: 1;
    display: flex;
    align-items: center;
    overflow: hidden;
  }
`

interface NotePageToolbarProps {
  storage: NoteStorage
  note?: NoteDoc
}

const NotePageToolbar = ({ storage, note }: NotePageToolbarProps) => {
  const { t } = useTranslation()
  const { bookmarkNote, unbookmarkNote } = useDb()
  const { preferences } = usePreferences()

  const editorControlMode = preferences['editor.controlMode']

  const { previewStyle } = usePreviewStyle()
  const { generalStatus, setGeneralStatus } = useGeneralStatus()
  const { noteViewMode, preferredEditingViewMode } = generalStatus
  const { pushMessage } = useToast()

  const storageId = storage.id
  const routeParams = useRouteParams()

  const noteId = note?._id

  const { push, goBack, goForward } = useRouter()
  const topbarTree = useMemo(() => {
    return mapTopBarTree(storage.noteMap, storage.folderMap, storage, push)
  }, [push, storage])
  const {
    openWorkspaceEditForm,
    openNewDocForm,
    openNewFolderForm,
    openRenameFolderForm,
    openRenameDocForm,
    deleteFolder,
    // deleteWorkspace,
    deleteOrTrashNote,
  } = useLocalUI()

  const bookmark = useCallback(async () => {
    if (noteId == null) {
      return
    }
    await bookmarkNote(storageId, noteId)
  }, [storageId, noteId, bookmarkNote])

  const unbookmark = useCallback(async () => {
    if (noteId == null) {
      return
    }
    await unbookmarkNote(storageId, noteId)
  }, [storageId, noteId, unbookmarkNote])

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
      if (note == null) {
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
    storage.attachmentMap,
  ])

  // const openTopbarSwitchSelectorContextMenu: MouseEventHandler<HTMLDivElement> = useCallback(
  //   (event) => {
  //     event.preventDefault()
  //     openContextMenu({
  //       menuItems: [
  //         {
  //           type: 'normal',
  //           label: 'Use 2 toggles layout',
  //           click: () => {
  //             setPreferences({
  //               'editor.controlMode': '2-toggles',
  //             })
  //           },
  //         },
  //         {
  //           type: 'normal',
  //           label: 'Use 3 buttons layout',
  //           click: () => {
  //             setPreferences({
  //               'editor.controlMode': '3-buttons',
  //             })
  //           },
  //         },
  //       ],
  //     })
  //   },
  //   [setPreferences]
  // )

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

  const toggleContextView = useCallback(() => {
    setGeneralStatus((previousGeneralStatus) => {
      return {
        showingNoteContextMenu: !previousGeneralStatus.showingNoteContextMenu,
      }
    })
  }, [setGeneralStatus])

  const folderPathname =
    note == null
      ? routeParams.name === 'workspaces.notes'
        ? routeParams.folderPathname
        : '/'
      : note.folderPathname

  const noteFolderOrFolder = useMemo(() => {
    if (note != null) {
      return storage.folderMap[note.folderPathname]
    } else if (routeParams.name === 'workspaces.notes') {
      return storage.folderMap[folderPathname]
    } else {
      return undefined
    }
  }, [folderPathname, note, routeParams.name, storage.folderMap])

  const topbar = useMemo(() => {
    const sharedControls = [
      ...(note != null
        ? [
            {
              variant: 'icon' as const,
              iconPath: note.data.bookmarked ? mdiStar : mdiStarOutline,
              tooltip: t(
                `bookmark.${!note.data.bookmarked ? 'add' : 'remove'}`
              ),
              active: !!note.data.bookmarked,
              onClick: () => toggleBookmark(),
            },
          ]
        : []),
      {
        variant: 'icon' as const,
        iconPath: generalStatus.showingNoteContextMenu
          ? mdiChevronRight
          : mdiChevronLeft,
        tooltip: 'Open Context View',
        active: generalStatus.showingNoteContextMenu,
        onClick: () => toggleContextView(),
      },
    ]
    return {
      ...({
        breadcrumbs: mapTopbarBreadcrumbs(
          storage.folderMap,
          storage,
          push,
          { pageNote: note, pageFolder: noteFolderOrFolder },
          openRenameFolderForm,
          openRenameDocForm,
          openNewDocForm,
          openNewFolderForm,
          openWorkspaceEditForm,
          deleteOrTrashNote,
          (storageName, folder) =>
            deleteFolder({ workspaceName: storageName, folder }),
          undefined
        ),
      } as TopbarProps),
      tree: topbarTree,
      navigation: {
        goBack,
        goForward,
      },
      controls:
        note == null
          ? []
          : editorControlMode === '3-buttons'
          ? [
              {
                variant: 'icon' as const,
                iconPath: mdiPencil,
                tooltip: t('note.edit'),
                active: noteViewMode === 'edit',
                onClick: () => selectEditMode(),
              },
              {
                variant: 'icon' as const,
                iconPath: mdiViewSplitVertical,
                tooltip: t('note.splitView'),
                active: noteViewMode === 'split',
                onClick: () => selectSplitMode(),
              },
              {
                variant: 'icon' as const,
                iconPath: mdiEyeOutline,
                tooltip: t('note.preview'),
                active: noteViewMode === 'preview',
                onClick: () => selectPreviewMode(),
              },
              {
                variant: 'icon' as const,
                iconPath: note.data.bookmarked ? mdiStar : mdiStarOutline,
                active: !!note.data.bookmarked,
                onClick: () => toggleBookmark(),
              },
              ...sharedControls,
            ]
          : [
              ...(noteViewMode !== 'preview'
                ? [
                    {
                      variant: 'icon' as const,
                      iconPath: mdiViewSplitVertical,
                      tooltip: 'Toggle Split',
                      active: noteViewMode === 'split',
                      onClick: () => toggleSplitEditMode(),
                    },
                  ]
                : []),
              noteViewMode !== 'preview'
                ? {
                    variant: 'icon' as const,
                    iconPath: mdiEyeOutline,
                    tooltip: t('note.preview'),
                    onClick: () => selectPreviewMode(),
                  }
                : {
                    variant: 'icon' as const,
                    iconPath: mdiPencil,
                    tooltip: t('note.edit'),
                    onClick: () => selectEditMode(),
                  },
              ...sharedControls,
            ],
    }
  }, [
    deleteFolder,
    deleteOrTrashNote,
    editorControlMode,
    generalStatus.showingNoteContextMenu,
    goBack,
    goForward,
    note,
    noteFolderOrFolder,
    noteViewMode,
    openNewDocForm,
    openNewFolderForm,
    openRenameFolderForm,
    openRenameDocForm,
    openWorkspaceEditForm,
    push,
    selectEditMode,
    selectPreviewMode,
    selectSplitMode,
    storage,
    t,
    toggleBookmark,
    toggleContextView,
    toggleSplitEditMode,
    topbarTree,
  ])

  return (
    <Container>
      <div className='left'>
        {topbar != null ? (
          <Topbar
            tree={topbar.tree}
            controls={topbar.controls}
            navigation={topbar.navigation}
            breadcrumbs={topbar.breadcrumbs}
            className='topbar'
          >
            {topbar.children}
          </Topbar>
        ) : (
          <div className='topbar topbar--placeholder'>{topbar}</div>
        )}
      </div>
    </Container>
  )
}

export default NotePageToolbar
