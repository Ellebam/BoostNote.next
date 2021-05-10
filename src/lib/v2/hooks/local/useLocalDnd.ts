import { useCallback, useRef } from 'react'
import { NavResource } from '../../interfaces/resources'
import { useToast } from '../../../../shared/lib/stores/toast'
import { FolderDoc, NoteDoc } from '../../../db/types'
import { UpdateFolderRequestBody, UpdateNoteRequestBody } from './useLocalDB'
import { getFolderPathname } from '../../../db/utils'
import { SidebarDragState } from '../../../../shared/lib/dnd'

export function useLocalDnd() {
  const draggedResource = useRef<NavResource>()
  // const {
  //   updateFoldersMap,
  //   updateDocsMap,
  //   updateWorkspacesMap,
  //   setCurrentPath,
  // } = useNav()
  // const { pageDoc, pageFolder } = usePage()
  const { pushApiErrorMessage, pushMessage } = useToast()

  const dropInStorage = useCallback(
    async (
      storageId: string,
      storageName: string,
      updateFolder: (folder: FolderDoc, body: UpdateFolderRequestBody) => void,
      updateDoc: (doc: NoteDoc, body: UpdateNoteRequestBody) => void
    ) => {
      if (draggedResource.current == null) {
        return
      }

      if (draggedResource.current.result._id === storageId) {
        pushMessage({
          title: 'Oops',
          description: 'Resource is already present in this workspace',
        })
        return
      }

      if (draggedResource.current.type === 'folder') {
        const folder = draggedResource.current.result
        updateFolder(folder, {
          storageName: storageName,
          oldPathname: getFolderPathname(folder._id),
          newPathname: getFolderPathname(folder._id), // how to update this correctly (use actual local space DND implementation
        })
      } else if (draggedResource.current.type === 'note') {
        const note = draggedResource.current.result
        updateDoc(note, {
          storageId: storageId,
          noteProps: note,
        })
      }
    },
    [pushMessage]
  )

  const dropInNoteOrFolder = useCallback(
    async (
      targetedResource: NavResource,
      targetedPosition: SidebarDragState
    ) => {
      if (draggedResource.current == null || targetedPosition == null) {
        return
      }

      if (
        draggedResource.current.type === targetedResource.type &&
        draggedResource.current.result._id === targetedResource.result._id
      ) {
        return
      }

      try {
        // const originalResourceId = getResourceId(draggedResource.current)
        // const pos = targetedPosition
        // move resource (note/folder)
        // const { folders, docs, workspaces } = await moveResource(
        //   { id: draggedResource.current.result.teamId },
        //   originalResourceId,
        //   {
        //     targetedPosition: pos,
        //     targetedResourceId: getResourceId(targetedResource),
        //   }
        // )
        // if (pageDoc != null && changedDocs.get(pageDoc.id) != null) {
        //   setCurrentPath(changedDocs.get(pageDoc.id)!.folderPathname)
        // }
      } catch (error) {
        pushApiErrorMessage(error)
      }
    },
    [pushApiErrorMessage]
  )

  return {
    draggedResource,
    dropInStorage,
    dropInDocOrFolder: dropInNoteOrFolder,
  }
}
