import React, { useCallback, useMemo } from 'react'
import { NoteStorage } from '../../lib/db/types'
import StorageLayout from '../atoms/StorageLayout'
import NoteDetail from '../organisms/NoteDetail'
import {
  StorageNotesRouteParams,
  StorageTagsRouteParams,
  StorageTrashCanRouteParams,
  useRouteParams,
} from '../../lib/routeParams'
import { useGeneralStatus } from '../../lib/generalStatus'
import { useDb } from '../../lib/db'
import FolderDetail from '../organisms/FolderDetail'
import TagDetail from '../organisms/TagDetail'
import TrashDetail from '../organisms/TrashDetail'
import SearchModal from '../organisms/SearchModal'
import { useSearchModal } from '../../lib/searchModal'
import styled from '../../lib/styled'
import { useRouter } from '../../lib/router'
import { parseNumberStringOrReturnZero } from '../../lib/string'
import NoteContextView from '../organisms/NoteContextView'
import CloudIntroModal from '../organisms/CloudIntroModal'
import { useCloudIntroModal } from '../../lib/cloudIntroModal'
import { mapTopBarTree } from '../../lib/v2/mappers/local/topbarTree'
import { mapTopbarBreadcrumbs } from '../../lib/v2/mappers/local/topbarBreadcrumbs'
import { useLocalUI } from '../../lib/v2/hooks/local/useLocalUI'
import Topbar, { TopbarProps } from '../../shared/components/organisms/Topbar'

interface WikiNotePageProps {
  storage: NoteStorage
}

const WikiNotePage = ({ storage }: WikiNotePageProps) => {
  const routeParams = useRouteParams() as
    | StorageNotesRouteParams
    | StorageTrashCanRouteParams
    | StorageTagsRouteParams
  const { push, goBack, goForward } = useRouter()
  const topbarTree = useMemo(() => {
    return mapTopBarTree(storage.noteMap, storage.folderMap, storage, push)
  }, [push, storage])
  const {
    openWorkspaceEditForm,
    openNewDocForm,
    openNewFolderForm,
    openRenameFolderForm,
    openRenameNoteForm,
    deleteFolder,
    // deleteWorkspace,
    deleteOrTrashNote,
  } = useLocalUI()

  const { hash } = useRouter()
  const { generalStatus } = useGeneralStatus()
  const { showingCloudIntroModal } = useCloudIntroModal()
  const noteViewMode = generalStatus.noteViewMode

  const note = useMemo(() => {
    switch (routeParams.name) {
      case 'storages.notes': {
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
      case 'storages.tags.show': {
        if (routeParams.noteId == null) {
          return undefined
        }
        const note = storage.noteMap[routeParams.noteId]
        if (note == null) {
          return undefined
        }
        if (!note.tags.includes(routeParams.tagName)) {
          return undefined
        }
        return note
      }
      case 'storages.trashCan': {
        if (routeParams.noteId == null) {
          return undefined
        }
        const note = storage.noteMap[routeParams.noteId]
        if (note == null || !note.trashed) {
          return undefined
        }
        return note
      }
    }
    return undefined
  }, [routeParams, storage.noteMap])

  const noteFolder = useMemo(() => {
    if (note != null) {
      return storage.folderMap[note.folderPathname]
    } else {
      return undefined
    }
  }, [note, storage.folderMap])

  const topbar = useMemo(() => {
    return {
      ...({
        breadcrumbs: mapTopbarBreadcrumbs(
          storage.folderMap,
          storage,
          push,
          { pageNote: note, pageFolder: noteFolder },
          openRenameFolderForm,
          openRenameNoteForm,
          openNewDocForm,
          openNewFolderForm,
          openWorkspaceEditForm,
          deleteOrTrashNote,
          (storageName, folder) => deleteFolder({ storageName, folder }),
          undefined
        ),
      } as TopbarProps),
      tree: topbarTree,
      navigation: {
        goBack,
        goForward,
      },
    }
  }, [
    deleteFolder,
    deleteOrTrashNote,
    goBack,
    goForward,
    note,
    noteFolder,
    openNewDocForm,
    openNewFolderForm,
    openRenameFolderForm,
    openRenameNoteForm,
    openWorkspaceEditForm,
    push,
    storage,
    topbarTree,
  ])

  const { updateNote, addAttachments } = useDb()

  const { showSearchModal } = useSearchModal()

  const getCurrentPositionFromRoute = useCallback(() => {
    let focusLine = 0
    let focusColumn = 0
    if (hash.startsWith('#L')) {
      const focusData = hash.substring(2).split(',')
      if (focusData.length == 2) {
        focusLine = parseNumberStringOrReturnZero(focusData[0])
        focusColumn = parseNumberStringOrReturnZero(focusData[1])
      } else if (focusData.length == 1) {
        focusLine = parseNumberStringOrReturnZero(focusData[0])
      }
    }

    return {
      line: focusLine,
      ch: focusColumn,
    }
  }, [hash])

  return (
    <StorageLayout storage={storage}>
      {showSearchModal && <SearchModal storage={storage} />}
      <Container>
        <ContentContainer
          className={
            note != null && generalStatus.showingNoteContextMenu ? '' : 'expand'
          }
        >
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
          {/*<NotePageToolbar note={note} storage={storage} />*/}
          <div className='detail'>
            {note == null ? (
              routeParams.name === 'storages.notes' ? (
                <FolderDetail
                  storage={storage}
                  folderPathname={routeParams.folderPathname}
                />
              ) : routeParams.name === 'storages.tags.show' ? (
                <TagDetail storage={storage} tagName={routeParams.tagName} />
              ) : routeParams.name === 'storages.trashCan' ? (
                <TrashDetail storage={storage} />
              ) : (
                <div>Idle</div>
              )
            ) : (
              <NoteDetail
                note={note}
                storage={storage}
                updateNote={updateNote}
                addAttachments={addAttachments}
                viewMode={noteViewMode}
                initialCursorPosition={getCurrentPositionFromRoute()}
              />
            )}
          </div>
        </ContentContainer>
        {note != null && generalStatus.showingNoteContextMenu && (
          <NoteContextView storage={storage} note={note} />
        )}
      </Container>
      {showingCloudIntroModal && <CloudIntroModal />}
    </StorageLayout>
  )
}

export default WikiNotePage

const Container = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  position: relative;
`

const ContentContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 350px;
  &.expand {
    right: 0;
  }
  display: flex;
  flex-direction: column;
  height: 100%;
  .detail {
    flex: 1;
    overflow: hidden;
  }
`
