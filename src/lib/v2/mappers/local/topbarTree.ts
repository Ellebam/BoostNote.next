import { BreadCrumbTreeItem } from '../types'
import { mdiFileDocumentOutline, mdiLock } from '@mdi/js'
import { FolderDoc, NoteDoc, NoteStorage, ObjectMap } from '../../../db/types'
import {
  getFolderNameFromPathname,
  getNoteTitle,
  getParentFolderPathname,
  values,
  getFolderPathname,
  excludeNoteIdPrefix,
} from '../../../db/utils'
import { topParentId } from '../cloud/topbarTree'

export function mapTopBarTree(
  noteMap: ObjectMap<NoteDoc>,
  foldersMap: ObjectMap<FolderDoc>,
  workspace: NoteStorage,
  push: (url: string) => void
) {
  const items = new Map<string, BreadCrumbTreeItem[]>()

  const [notes, folders] = [values(noteMap), values(foldersMap)]
  // todo: maybe implement all file system storages and navigate through them?
  const href = `/app/storage/${workspace.id}`
  items.set(topParentId, [
    {
      id: workspace.id,
      label: workspace.name,
      parentId: topParentId,
      defaultIcon: mdiLock,
      link: {
        href,
        navigateTo: () => push(href),
      },
    },
  ] as BreadCrumbTreeItem[])

  folders.forEach((folder: FolderDoc) => {
    const folderPathname = getFolderPathname(folder._id)
    console.log('got pathname', folderPathname)
    // if (folderPathname == '/') return
    const href = `/app/storages/${workspace.id}/${
      folderPathname == '/' ? '' : 'notes' + folderPathname
    }`
    const folderId = folderPathname == '/' ? workspace.id : folder._id
    const parentFolderDoc =
      workspace.folderMap[getParentFolderPathname(folderPathname)]
    console.log('parnet folder doc', parentFolderDoc)
    const parentId =
      parentFolderDoc != null
        ? parentFolderDoc.pathname == '/'
          ? workspace.id
          : parentFolderDoc._id
        : workspace.id

    let folderLabel = getFolderNameFromPathname(folderPathname)
    console.log('Folder label', folderLabel, folderPathname)
    if (folderLabel == null) {
      folderLabel = workspace.name
    }
    const parentArray = items.get(parentId) || []
    parentArray.push({
      id: folderId,
      label: folderLabel,
      emoji: undefined,
      parentId:
        // parentFolderDoc != null ? parentFolderDoc.pathname : workspace.id,
        parentFolderDoc != null ? parentFolderDoc._id : workspace.id,
      link: {
        href,
        navigateTo: () => push(href),
      },
    })
    items.set(parentId, parentArray)
  })

  notes
    .filter((note) => !note.trashed)
    .forEach((note) => {
      const noteId = note._id
      console.log('note id is', noteId)
      const href = `/app/storages/${workspace.id}/notes/${excludeNoteIdPrefix(
        note._id
      )}`
      const parentFolderDoc =
        workspace.folderMap[getParentFolderPathname(note.folderPathname)]
      console.log('looking for', parentFolderDoc, note.folderPathname)
      const parentId =
        parentFolderDoc != null
          ? parentFolderDoc.pathname == '/'
            ? workspace.id
            : parentFolderDoc._id
          : workspace.id

      const parentArray = items.get(parentId) || []
      console.log('Setting parent id', parentId)
      parentArray.push({
        id: noteId,
        label: getNoteTitle(note, 'Untitled'),
        emoji: undefined,
        defaultIcon: mdiFileDocumentOutline,
        parentId:
          // parentFolderDoc != null ? parentFolderDoc.pathname : workspace.id,
          parentFolderDoc != null ? parentFolderDoc._id : workspace.id,
        link: {
          href,
          navigateTo: () => push(href),
        },
      })
      items.set(parentId, parentArray)
    })

  console.log('Got items', items)
  return items
}
