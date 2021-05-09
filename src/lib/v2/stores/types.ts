export type CollapsableType = 'folders' | 'storages' | 'links'
export type CollapsableContent = {
  [type in CollapsableType]: string[]
}
export type LocallyStoredSidebarCollapse = {
  [storageId: string]: CollapsableContent
}

export interface SidebarCollapseContext {
  sideBarOpenedFolderIdsSet: Set<string>
  sideBarOpenedStorageIdsSet: Set<string>
  sideBarOpenedLinksIdsSet: Set<string>
  setToLocalStorage: (storageId: string, content: CollapsableContent) => void
  toggleItem: (type: CollapsableType, id: string) => void
  foldItem: (type: CollapsableType, id: string) => void
  unfoldItem: (type: CollapsableType, id: string) => void
}
