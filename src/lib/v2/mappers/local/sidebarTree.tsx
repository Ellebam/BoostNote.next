import {
  getMapValues,
  sortByAttributeAsc,
  sortByAttributeDesc,
} from '../../../../shared/lib/utils/array'
import {
  mdiApplicationCog,
  mdiArchiveOutline,
  mdiFileDocumentOutline,
  mdiFilePlusOutline,
  mdiFolderPlusOutline,
  mdiLock,
  mdiPaperclip,
  mdiPencil,
  mdiPlus,
  mdiStar,
  mdiStarOutline,
  mdiTag,
  mdiTrashCanOutline,
  mdiFolderOutline,
} from '@mdi/js'
import { MenuItem, MenuTypes } from '../../../../shared/lib/stores/contextMenu'
import { SidebarDragState } from '../../../../shared/lib/dnd'
import {
  SidebarNavCategory,
  SidebarNavControls,
  SidebarTreeChildRow,
} from '../../../../shared/components/organisms/Sidebar/molecules/SidebarTree'
import React from 'react'
import {
  FolderDoc,
  NoteDoc,
  NoteStorage,
  ObjectMap,
  TagDoc,
} from '../../../db/types'
import { FoldingProps } from '../../../../shared/components/atoms/FoldingWrapper'
import {
  getAttachmentsHref,
  getFolderHref,
  getFolderName,
  getFolderPathname,
  getNoteHref,
  getNoteTitle,
  getParentFolderPathname,
  getStorageHref,
  getTagHref,
  getTagName,
  getTrashCanHref,
  isSubPathname,
  values,
} from '../../../db/utils'
import { SidebarTreeSortingOrder } from '../../../../shared/lib/sidebar'
import {
  CreateFolderRequestBody,
  CreateNoteRequestBody,
  CreateStorageRequestBody,
} from '../../hooks/local/useLocalDB'
import { NavResource } from '../../interfaces/resources'
import { CollapsableType } from '../../stores/sidebarCollapse'
import BasicInputFormLocal from '../../../../components/v2/organisms/BasicInputFormLocal'

type LocalTreeItem = {
  id: string
  parentId?: string
  label: string
  defaultIcon?: string
  emoji?: string
  bookmarked?: boolean
  trashed?: boolean
  children: string[]
  folding?: FoldingProps
  folded?: boolean
  href?: string
  active?: boolean
  lastUpdated?: string // could be calculated for workspace as any last updated
  navigateTo?: () => void
  controls?: SidebarNavControls[]
  contextControls?: MenuItem[]
  dropIn?: boolean
  dropAround?: boolean
  onDragStart?: () => void
  onDrop?: (position?: SidebarDragState) => void
}

function getFolderChildrenOrderedIds(
  parentFolder: FolderDoc,
  notes: NoteDoc[],
  folders: FolderDoc[]
): string[] {
  const children: string[] = []
  notes.forEach((note) => {
    if (note.folderPathname == getFolderPathname(parentFolder._id)) {
      children.push(note._id)
    }
  })

  folders.forEach((folder) => {
    if (isSubPathname(parentFolder._id, folder._id)) {
      children.push(folder._id)
    }
  })

  return children
}

export function mapTree(
  initialLoadDone: boolean,
  sortingOrder: SidebarTreeSortingOrder,
  storage: NoteStorage,
  noteMap: ObjectMap<NoteDoc>,
  folderMap: ObjectMap<FolderDoc>,
  tagsMap: ObjectMap<TagDoc>,
  currentPath: string,
  sideBarOpenedLinksIdsSet: Set<string>,
  sideBarOpenedFolderIdsSet: Set<string>,
  sideBarOpenedStoragesIdsSet: Set<string>,
  toggleItem: (type: CollapsableType, id: string) => void,
  getFoldEvents: (type: CollapsableType, key: string) => FoldingProps,
  push: (url: string) => void,
  openModal: (content: JSX.Element) => void,
  toggleNoteBookmark: (
    storageId: string,
    noteId: string,
    bookmarked: boolean
  ) => void,
  createStorage: (
    body: CreateStorageRequestBody,
    options: {
      skipRedirect?: boolean
      afterSuccess?: (storage: NoteStorage) => void
    }
  ) => Promise<void>,
  deleteStorage: (storage: NoteStorage) => void,
  toggleNoteTrashed: (
    storageId: string,
    noteId: string,
    trashed: boolean
  ) => void,
  deleteFolder: (target: {
    storageId: string
    storageName: string
    pathname: string
  }) => Promise<void>,
  createFolder: (body: CreateFolderRequestBody) => Promise<void>,
  createNote: (body: CreateNoteRequestBody) => Promise<void>,
  draggedResource: React.MutableRefObject<NavResource | undefined>,
  dropInFolderOrDoc: (
    targetedResource: NavResource,
    targetedPosition: SidebarDragState
  ) => void,
  dropInStorage: (id: string) => void,
  openRenameFolderForm: (storageId: string, folder: FolderDoc) => void,
  openRenameNoteForm: (storageId: string, note: NoteDoc) => void,
  openStorageEditForm: (storage: NoteStorage) => void
) {
  if (!initialLoadDone || storage == null) {
    return undefined
  }

  const currentPathWithStorage = `${getStorageHref(storage)}/${currentPath}`
  const items = new Map<string, LocalTreeItem>()
  const [notes, folders] = [values(noteMap), values(folderMap)]

  const href = getStorageHref(storage)
  items.set(storage.id, {
    id: storage.id,
    label: storage.name,
    defaultIcon: mdiLock,
    children: [], // storage.positions?.orderedIds || [],
    folded: !sideBarOpenedStoragesIdsSet.has(storage.id),
    folding: getFoldEvents('storages', storage.id),
    href,
    active: true, //  href === currentPathWithStorage,
    navigateTo: () => push(href),
    dropIn: true,
    onDrop: () => dropInStorage(storage.id),
    controls: [
      {
        icon: mdiFilePlusOutline,
        onClick: undefined,
        placeholder: 'Note title..',
        create: (title: string) =>
          createNote({ storageId: storage.id, noteProps: { title: title } }),
      },
      {
        icon: mdiFolderPlusOutline,
        onClick: undefined,
        placeholder: 'Folder name..',
        create: (folderName: string) =>
          createFolder({
            storageId: storage.id,
            storageName: storage.name,
            folderName: folderName,
            destinationPathname: '/',
          }),
      },
    ],
    // todo: what is default for?
    contextControls: [
      {
        type: MenuTypes.Normal,
        icon: mdiApplicationCog,
        label: 'Edit',
        onClick: () => openStorageEditForm(storage),
      },
      {
        type: MenuTypes.Normal,
        icon: mdiTrashCanOutline,
        label: 'Delete',
        onClick: () => deleteStorage(storage),
      },
    ],
  })

  folders.forEach((folder) => {
    const folderId = folder._id
    const folderName = getFolderName(folder, storage.name)
    const folderPathname = getFolderPathname(folderId)
    // if (folderPathname == '/') {
    //   return
    // }
    const parentFolderPathname = getParentFolderPathname(folderPathname)
    const href = getFolderHref(folder, storage.id)
    const parentFolderDoc = folderMap[parentFolderPathname]
    const parentFolderId =
      parentFolderDoc != null && parentFolderPathname != '/'
        ? parentFolderDoc._id
        : storage.id
    items.set(folderId, {
      id: folderId,
      lastUpdated: folder.updatedAt,
      label: folderName,
      folded: !sideBarOpenedFolderIdsSet.has(folderId),
      folding: getFoldEvents('folders', folderId),
      href,
      active: href === currentPathWithStorage,
      navigateTo: () => push(href),
      onDrop: (position: SidebarDragState) =>
        dropInFolderOrDoc({ type: 'folder', result: folder }, position),
      onDragStart: () => {
        draggedResource.current = { type: 'folder', result: folder }
      },
      dropIn: true,
      dropAround: sortingOrder === 'drag',
      controls: [
        {
          icon: mdiFilePlusOutline,
          onClick: undefined,
          placeholder: 'Note title..',
          create: (title: string) =>
            createNote({
              storageId: storage.id,
              noteProps: {
                title: title,
                folderPathname: parentFolderPathname,
              },
            }),
        },
        {
          icon: mdiFolderPlusOutline,
          onClick: undefined,
          placeholder: 'Folder name..',
          create: (folderName: string) =>
            createFolder({
              storageId: storage.id,
              storageName: storage.name,
              destinationPathname: parentFolderPathname,
              folderName: folderName,
            }),
        },
      ],

      contextControls: [
        // todo: no control for bookmark for now (add bookmarked property to folder DB
        // {
        // type: MenuTypes.Normal,
        // icon: folder.bookmarked ? mdiStar : mdiStarOutline,
        // label:
        //   treeSendingMap.get(folderId) === 'bookmark'
        //     ? '...'
        //     : folder.bookmarked
        //     ? 'Bookmarked'
        //     : 'Bookmark',
        // onClick: () =>
        //   toggleFolderBookmark(folder.teamId, folder.id, folder.bookmarked),
        // },
        {
          type: MenuTypes.Normal,
          icon: mdiPencil,
          label: 'Rename',
          onClick: () => openRenameFolderForm(storage.id, folder),
        },
        {
          type: MenuTypes.Normal,
          icon: mdiTrashCanOutline,
          label: 'Delete',
          onClick: () =>
            deleteFolder({
              storageId: storage.id,
              storageName: storage.name,
              pathname: folderPathname,
            }),
        },
      ],
      parentId: parentFolderId,
      children: getFolderChildrenOrderedIds(folder, notes, folders),
      // typeof folder.positions != null && typeof folder.positions !== 'string'
      //   ? folder.positions.orderedIds
      //   : [],
    })
  })

  notes.forEach((note) => {
    const noteId = note._id
    const href = getNoteHref(note, storage.id)
    const bookmarked = !!note.data.bookmarked
    const parentFolderDoc = storage.folderMap[note.folderPathname]
    const parentNoteId =
      parentFolderDoc != null
        ? parentFolderDoc.pathname == '/'
          ? storage.id
          : parentFolderDoc._id
        : storage.id
    items.set(noteId, {
      id: noteId,
      lastUpdated: note.updatedAt, // doc.head != null ? doc.head.created : doc.updatedAt,
      label: getNoteTitle(note, 'Untitled'),
      bookmarked: bookmarked,
      defaultIcon: mdiFileDocumentOutline,
      trashed: note.trashed,
      children: [],
      href,
      active: href === currentPathWithStorage,
      dropAround: sortingOrder === 'drag',
      navigateTo: () => push(href),
      onDrop: (position: SidebarDragState) =>
        dropInFolderOrDoc({ type: 'note', result: note }, position),
      onDragStart: () => {
        draggedResource.current = { type: 'note', result: note }
      },
      contextControls: [
        {
          type: MenuTypes.Normal,
          icon: bookmarked ? mdiStar : mdiStarOutline,
          label: bookmarked ? 'Bookmarked' : 'Bookmark',
          onClick: () => toggleNoteBookmark(storage.id, noteId, bookmarked),
        },
        {
          type: MenuTypes.Normal,
          icon: mdiPencil,
          label: 'Rename',
          onClick: () => openRenameNoteForm(storage.id, note),
        },
        {
          type: MenuTypes.Normal,
          icon: mdiArchiveOutline,
          label: note.trashed ? 'Restore' : 'Archive',
          onClick: () => toggleNoteTrashed(storage.id, noteId, note.trashed),
        },
      ],
      parentId: parentNoteId,
    })
  })

  const arrayItems = getMapValues(items)
  const tree: Partial<SidebarNavCategory>[] = []

  // console.log('Array items', arrayItems)
  const bookmarked = arrayItems.reduce((acc, val) => {
    if (!val.bookmarked) {
      return acc
    }
    acc.push({
      id: val.id,
      depth: 0,
      label: val.label,
      emoji: val.emoji,
      defaultIcon: val.defaultIcon,
      href: val.href,
      navigateTo: val.navigateTo,
      contextControls: val.contextControls,
    })
    return acc
  }, [] as SidebarTreeChildRow[])

  const navTree = arrayItems
    .filter((item) => item.parentId == null || item.parentId == storage.id)
    .reduce((acc, val) => {
      acc.push({
        ...val,
        depth: 0,
        rows: buildChildrenNavRows(sortingOrder, val.children, 1, items),
      })
      return acc
    }, [] as SidebarTreeChildRow[])

  const notesPerTagIdMap = notes.reduce((acc, note) => {
    const noteTagNames = note.tags || []
    // maybe fetch tag Ids
    noteTagNames.forEach((tagName) => {
      const tag = tagsMap[tagName]
      if (tag) {
        let noteIds = acc.get(tag._id)
        if (noteIds == null) {
          noteIds = []
          acc.set(tag._id, noteIds)
        }
        noteIds.push(note._id)
      }
    })
    return acc
  }, new Map<string, string[]>())

  const labels = values(tagsMap)
    .filter((tag) => (notesPerTagIdMap.get(tag._id) || []).length > 0)
    .sort((a, b) => {
      if (a._id < b._id) {
        // tag._id == tagName
        return -1
      } else {
        return 1
      }
    })
    .reduce((acc, val) => {
      const tagName = getTagName(val._id)
      // const noteIds: string[] | undefined = notesPerTagIdMap.get(tagName)
      const href = getTagHref(
        storage,
        tagName
        // noteIds != null && noteIds.length > 0 ? noteIds[0] : undefined
      )
      acc.push({
        id: val._id,
        depth: 0,
        label: tagName,
        defaultIcon: mdiTag,
        href,
        active: href === currentPathWithStorage,
        navigateTo: () => push(href),
      })
      return acc
    }, [] as SidebarTreeChildRow[])

  if (bookmarked.length > 0) {
    tree.push({
      label: 'Bookmarks',
      rows: bookmarked,
    })
  }
  tree.push({
    label: 'Storages',
    shrink: 2,
    rows: navTree,
    controls: [
      {
        icon: mdiPlus,
        onClick: () =>
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
                  // pushMessage({
                  //   title: 'Cannot rename storage',
                  //   description: 'Storage name should not be empty.',
                  // })
                  return
                }
                await createStorage(
                  { name: storageName, props: { type: 'fs', location: '/' } },
                  {}
                )
              }}
            />
          ),
      },
    ],
  })

  // if (!team.personal) {
  //   tree.push({
  //     label: 'Private',
  //     shrink: 2,
  //     rows:
  //       personalWorkspace != null
  //         ? arrayItems
  //             .filter((item) => item.parentId === personalWorkspace!.id)
  //             .reduce((acc, val) => {
  //               acc.push({
  //                 ...val,
  //                 depth: 0,
  //                 rows: buildChildrenNavRows(
  //                   sortingOrder,
  //                   val.children,
  //                   1,
  //                   items
  //                 ),
  //               })
  //               return acc
  //             }, [] as SidebarTreeChildRow[])
  //         : [],
  //     controls: [
  //       {
  //         icon: mdiFilePlusOutline,
  //         onClick: undefined,
  //         placeholder: 'Note title..',
  //         create: async (title: string) => {
  //           if (personalWorkspace == null) {
  //             return createWorkspace(
  //               team,
  //               {
  //                 personal: true,
  //                 name: 'Private',
  //                 permissions: [],
  //                 public: false,
  //               },
  //               {
  //                 skipRedirect: true,
  //                 afterSuccess: (wp) =>
  //                   createDoc(team, {
  //                     workspaceId: wp.id,
  //                     title,
  //                   }),
  //               }
  //             )
  //           }
  //
  //           return createDoc(team, {
  //             workspaceId: personalWorkspace!.id,
  //             title,
  //           })
  //         },
  //       },
  //       {
  //         icon: mdiFolderPlusOutline,
  //         onClick: undefined,
  //         placeholder: 'Folder name..',
  //         create: async (folderName: string) => {
  //           if (personalWorkspace == null) {
  //             return createWorkspace(
  //               team,
  //               {
  //                 personal: true,
  //                 name: 'Private',
  //                 permissions: [],
  //                 public: false,
  //               },
  //               {
  //                 skipRedirect: true,
  //                 afterSuccess: (wp) =>
  //                   createFolder(team, {
  //                     workspaceId: wp.id,
  //                     description: '',
  //                     folderName,
  //                   }),
  //               }
  //             )
  //           }
  //
  //           return createFolder(team, {
  //             workspaceId: personalWorkspace!.id,
  //             description: '',
  //             folderName,
  //           })
  //         },
  //       },
  //     ],
  //   })
  // }

  if (labels.length > 0) {
    tree.push({
      label: 'Labels',
      rows: labels,
    })
  }

  const attachmentsHref = getAttachmentsHref(storage)
  const trashCanHref = getTrashCanHref(storage)
  tree.push({
    label: 'More',
    rows: [
      {
        id: 'sidenav-attachment',
        label: 'Attachments',
        defaultIcon: mdiPaperclip,
        href: attachmentsHref,
        active: attachmentsHref === currentPathWithStorage,
        navigateTo: () => push(attachmentsHref),
        depth: 0,
      },
      // {
      //   id: 'sidenav-shared',
      //   label: 'Shared',
      //   defaultIcon: mdiWeb,
      //   href: getTeamLinkHref(team, 'shared'),
      //   active: getTeamLinkHref(team, 'shared') === currentPath,
      //   navigateTo: () => push(getTeamLinkHref(team, 'shared')),
      //   depth: 0,
      // },
      {
        id: 'sidenav-archived', // todo: custom ID? style it?
        label: 'Trash',
        defaultIcon: mdiArchiveOutline,
        href: trashCanHref,
        active: trashCanHref === currentPathWithStorage,
        navigateTo: () => push(trashCanHref),
        depth: 0,
      },
    ],
  })

  tree.forEach((category) => {
    const key = (category.label || '').toLocaleLowerCase()
    const foldKey = `fold-${key}`
    const hideKey = `hide-${key}`
    category.folded = sideBarOpenedLinksIdsSet.has(foldKey)
    category.folding = getFoldEvents('links', foldKey)
    category.hidden = sideBarOpenedLinksIdsSet.has(hideKey)
    category.toggleHidden = () => toggleItem('links', hideKey)
  })
  console.log('Got Sidebar tree', tree)
  return tree as SidebarNavCategory[]
}

function buildChildrenNavRows(
  sortingOrder: SidebarTreeSortingOrder,
  childrenIds: string[],
  depth: number,
  map: Map<string, LocalTreeItem>
) {
  const rows = childrenIds.reduce((acc, childId) => {
    const childRow = map.get(childId)
    if (childRow == null) {
      return acc
    }

    if (childRow.trashed) {
      return acc
    }

    acc.push({
      ...childRow,
      depth,
      rows: buildChildrenNavRows(
        sortingOrder,
        childRow.children,
        depth + 1,
        map
      ),
    })

    return acc
  }, [] as (SidebarTreeChildRow & { lastUpdated?: string })[])

  switch (sortingOrder) {
    case 'a-z':
      return sortByAttributeAsc('label', rows)
    case 'z-a':
      return sortByAttributeDesc('label', rows)
    case 'last-updated':
      return sortByAttributeDesc('lastUpdated', rows)
    case 'drag':
    default:
      return rows
  }
}
