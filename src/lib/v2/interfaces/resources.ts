import { FolderDoc, NoteDoc } from '../../db/types'

export type SerializedFolderNav = {
  type: 'folder'
  result: FolderDoc
}

export type SerializedNoteNav = {
  type: 'note'
  result: NoteDoc
}

export type SerializedPendingNav = {
  type: 'folder' | 'note'
  result: string
}

export type NavResource = SerializedFolderNav | SerializedNoteNav
export type PendingNavResource = NavResource | SerializedPendingNav

export type OrderedNavResource = NavResource & { order?: number }
export type OrderedPendingNavResource = PendingNavResource & { order?: number }
