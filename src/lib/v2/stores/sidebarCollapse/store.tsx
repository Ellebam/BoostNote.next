import { useState, useCallback, useMemo, useEffect } from 'react'
import { localLiteStorage } from 'ltstrg'
import {
  SidebarCollapseContext,
  LocallyStoredSidebarCollapse,
  CollapsableContent,
  CollapsableType,
} from './types'
import { sidebarCollapseKey } from '../../../localStorageKeys'
import { useLocalDB } from '../../hooks/local/useLocalDB'
import { useActiveStorageId } from '../../../routeParams'
import { NoteStorage } from '../../../db/types'
import { createStoreContext } from '../../../../shared/lib/utils/context'

const initialContent: CollapsableContent = {
  folders: [],
  storages: [],
  links: [],
}

function useSidebarCollapseStore(): SidebarCollapseContext {
  const { storageMap } = useLocalDB()
  const storageId = useActiveStorageId()
  const storage: NoteStorage | undefined =
    storageId != null ? storageMap[storageId] : undefined

  const [currentStorageCollapsable, setCurrentStorageCollapsable] = useState<
    CollapsableContent
  >(initialContent)

  const setToLocalStorage = useCallback(
    (storageId: string, content: CollapsableContent) => {
      let baseData = localLiteStorage.getItem(sidebarCollapseKey)
      if (baseData == null) {
        baseData = '{}'
      }
      const data = JSON.parse(baseData)
      data[storageId] = content
      localLiteStorage.setItem(sidebarCollapseKey, JSON.stringify(data))
    },
    []
  )

  const toggleItem = useCallback((type: CollapsableType, id: string) => {
    setCurrentStorageCollapsable((prev) => {
      const newSet = new Set(prev[type])
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return { ...prev, [type]: [...newSet] }
    })
  }, [])

  const foldItem = useCallback((type: CollapsableType, id: string) => {
    setCurrentStorageCollapsable((prev) => {
      const newSet = new Set(prev[type])
      if (!newSet.has(id)) {
        return prev
      }
      newSet.delete(id)
      return { ...prev, [type]: [...newSet] }
    })
  }, [])

  const unfoldItem = useCallback((type: CollapsableType, id: string) => {
    setCurrentStorageCollapsable((prev) => {
      const newSet = new Set(prev[type])

      if (newSet.has(id)) {
        return prev
      }
      newSet.add(id)
      return { ...prev, [type]: [...newSet] }
    })
  }, [])

  const sideBarOpenedFolderIdsSet = useMemo(() => {
    return new Set(currentStorageCollapsable.folders)
  }, [currentStorageCollapsable])

  const sideBarOpenedStorageIdsSet = useMemo(() => {
    return new Set(currentStorageCollapsable.storages)
  }, [currentStorageCollapsable])

  const sideBarOpenedLinksIdsSet = useMemo(() => {
    return new Set(currentStorageCollapsable.links)
  }, [currentStorageCollapsable])

  // LOAD FROM LOCAL STORAGE
  useEffect(() => {
    if (storage == null) {
      return
    }

    try {
      const stringifiedData = localLiteStorage.getItem(sidebarCollapseKey)
      if (stringifiedData == null) {
        return
      }
      const locallyStoredDatas = JSON.parse(
        stringifiedData
      ) as LocallyStoredSidebarCollapse
      setCurrentStorageCollapsable(
        locallyStoredDatas[storage.id] || initialContent
      )
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(error.message)
    }
  }, [storage])

  // SAVE CHANGES TO LOCALSTORAGE
  useEffect(() => {
    if (storage == null) {
      return
    }
    let baseData = localLiteStorage.getItem(sidebarCollapseKey)
    if (baseData == null) {
      baseData = '{}'
    }
    const data = JSON.parse(baseData)
    data[storage!.id] = currentStorageCollapsable
    localLiteStorage.setItem(sidebarCollapseKey, JSON.stringify(data))
  }, [currentStorageCollapsable, storage])

  return {
    sideBarOpenedFolderIdsSet,
    sideBarOpenedStorageIdsSet,
    sideBarOpenedLinksIdsSet,
    setToLocalStorage,
    toggleItem,
    unfoldItem,
    foldItem,
  }
}

export const {
  StoreProvider: SidebarCollapseProvider,
  useStore: useSidebarCollapse,
} = createStoreContext(useSidebarCollapseStore, 'sidebarCollapse')
