import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from '../../lib/router'
import { useDb } from '../../lib/db'
import { useDialog, DialogIconTypes } from '../../lib/dialog'
import { usePreferences } from '../../lib/preferences'
import { NoteStorage } from '../../lib/db/types'
import {
  openContextMenu,
  addIpcListener,
  removeIpcListener,
} from '../../lib/electronOnly'
import { entries, getTimelineHref, values } from '../../lib/db/utils'
import { MenuItemConstructorOptions } from 'electron'
import { useStorageRouter } from '../../lib/storageRouter'
import { useRouteParams } from '../../lib/routeParams'
import { mdiTextBoxPlusOutline } from '@mdi/js'
import { noteDetailFocusTitleInputEventEmitter } from '../../lib/events'
import { useTranslation } from 'react-i18next'
import { useSearchModal } from '../../lib/searchModal'
import styled from '../../shared/lib/styled'
import Button from '../../shared/components/atoms/Button'
import Sidebar from '../../shared/components/organisms/Sidebar'
import cc from 'classcat'
import {
  SidebarState,
  SidebarTreeSortingOrders,
} from '../../shared/lib/sidebar'
import { MenuTypes, useContextMenu } from '../../shared/lib/stores/contextMenu'
import { SidebarToolbarRow } from '../../shared/components/organisms/Sidebar/molecules/SidebarToolbar'
import { mapToolbarRows } from '../../lib/v2/mappers/local/sidebarRows'
import { useGeneralStatus } from '../../lib/generalStatus'
import { mapHistory } from '../../lib/v2/mappers/local/sidebarHistory'
import { SidebarSearchResult } from '../../shared/components/organisms/Sidebar/molecules/SidebarSearch'
import { AppUser } from '../../shared/lib/mappers/users'
import useApi from '../../shared/lib/hooks/useApi'
import { useDebounce } from 'react-use'
import {
  GetSearchResultsRequestQuery,
  NoteSearchData,
} from '../../lib/search/search'
import {
  getSearchResultItems,
  mapSearchResults,
} from '../../lib/v2/mappers/local/searchResults'
import { useLocalUI } from '../../lib/v2/hooks/local/useLocalUI'
import { mapTree } from '../../lib/v2/mappers/local/sidebarTree'
import { useLocalDB } from '../../lib/v2/hooks/local/useLocalDB'
import { useLocalDnd } from '../../lib/v2/hooks/local/useLocalDnd'
import { buildSpacesBottomRows } from '../../cloud/components/Application'
import { CollapsableType } from '../../lib/v2/stores/sidebarCollapse'
import { useSidebarCollapse } from '../../lib/v2/stores/sidebarCollapse'
import { useCloudIntroModal } from '../../lib/cloudIntroModal'
import { mapLocalSpaces } from '../../lib/v2/mappers/local/sidebarSpaces'
import { osName } from '../../shared/lib/platform'

interface NoteStorageNavigatorProps {
  storage: NoteStorage
}

const NoteStorageNavigator = ({ storage }: NoteStorageNavigatorProps) => {
  const {
    createNote,
    createStorage,
    storageMap,
    renameStorage,
    removeStorage,
  } = useDb()
  const { prompt, messageBox } = useDialog()
  const { push, hash, pathname } = useRouter()
  const { navigate } = useStorageRouter()
  const { openTab, togglePreferencesModal } = usePreferences()
  const routeParams = useRouteParams()
  const storageId = storage.id
  const { t } = useTranslation()

  const openCreateStorageDialog = useCallback(() => {
    prompt({
      title: 'Create a Space',
      message: 'Enter name of a space to create',
      iconType: DialogIconTypes.Question,
      submitButtonLabel: 'Create Space',
      onClose: async (value: string | null) => {
        if (value == null) return
        const storage = await createStorage(value)
        push(`/app/storages/${storage.id}/notes`)
      },
    })
  }, [prompt, createStorage, push])

  const openStorageContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()

      const storages = values(storageMap)
      openContextMenu({
        menuItems: [
          {
            type: 'normal',
            label: t('storage.rename'),
            click: async () => {
              prompt({
                title: `Rename "${storage.name}" Space`,
                message: t('storage.renameMessage'),
                iconType: DialogIconTypes.Question,
                defaultValue: storage.name,
                submitButtonLabel: t('storage.rename'),
                onClose: async (value: string | null) => {
                  if (value == null) return
                  renameStorage(storage.id, value)
                },
              })
            },
          },
          {
            type: 'normal',
            label: t('storage.remove'),
            click: async () => {
              messageBox({
                title: `Remove "${storage.name}" Space`,
                message:
                  storage.type === 'fs'
                    ? "This operation won't delete the actual space folder. You can add it to the app again."
                    : t('storage.removeMessage'),
                iconType: DialogIconTypes.Warning,
                buttons: [t('storage.remove'), t('general.cancel')],
                defaultButtonIndex: 0,
                cancelButtonIndex: 1,
                onClose: (value: number | null) => {
                  if (value === 0) {
                    removeStorage(storage.id)
                  }
                },
              })
            },
          },
          {
            type: 'separator',
          },
          {
            type: 'normal',
            label: 'Preferences',
            click: () => {
              togglePreferencesModal()
            },
          },
          {
            type: 'separator',
          },
          ...storages
            .filter((storage) => {
              return storage.id !== storageId
            })
            .map<MenuItemConstructorOptions>((storage) => {
              return {
                type: 'normal',
                label: `Switch to ${storage.name} storage`,
                click: () => {
                  navigate(storage.id)
                },
              }
            }),
          {
            type: 'separator',
          },
          {
            type: 'normal',
            label: 'New Space',
            click: () => {
              openCreateStorageDialog()
            },
          },
        ],
      })
    },
    [
      storageMap,
      t,
      prompt,
      storage.name,
      storage.id,
      storage.type,
      renameStorage,
      messageBox,
      togglePreferencesModal,
      storageId,
      navigate,
      openCreateStorageDialog,
      removeStorage,
    ]
  )

  // const extraNewNoteLabel = useMemo<React.ReactNode | null>(() => {
  //   switch (routeParams.name) {
  //     case 'storages.notes':
  //       if (routeParams.folderPathname !== '/') {
  //         return (
  //           <>
  //             in <Icon className='icon' path={mdiFolderOutline} />{' '}
  //             {getFolderNameFromPathname(routeParams.folderPathname)}
  //           </>
  //         )
  //       }
  //       break
  //     case 'storages.tags.show':
  //       return (
  //         <>
  //           with <Icon className='icon' path={mdiTag} />
  //           {routeParams.tagName}
  //         </>
  //       )
  //   }
  //   return null
  // }, [routeParams])

  const createNoteByRoute = useCallback(async () => {
    let folderPathname = '/'
    let tags: string[] = []
    let baseHrefAfterCreate = `/app/storages/${storageId}/notes`
    switch (routeParams.name) {
      case 'workspaces.labels.show':
        tags = [routeParams.tagName]
        baseHrefAfterCreate = `/app/storages/${storageId}/tags/${routeParams.tagName}`
        break
      case 'workspaces.notes':
        if (routeParams.folderPathname !== '/') {
          folderPathname = routeParams.folderPathname
          baseHrefAfterCreate = `/app/storages/${storageId}/notes${folderPathname}`
        }
        break
    }

    const note = await createNote(storageId, {
      folderPathname,
      tags,
    })
    if (note == null) {
      return
    }

    push(`${baseHrefAfterCreate}/${note._id}#new`)
  }, [storageId, routeParams, push, createNote])

  useEffect(() => {
    if (hash === '#new') {
      push({ hash: '' })
      setImmediate(() => {
        noteDetailFocusTitleInputEventEmitter.dispatch()
      })
    }
  }, [push, hash])

  useEffect(() => {
    const handler = () => {
      createNoteByRoute()
    }
    addIpcListener('new-note', handler)
    return () => {
      removeIpcListener('new-note', handler)
    }
  }, [createNoteByRoute])

  const { toggleShowSearchModal } = useSearchModal()

  useEffect(() => {
    const handler = () => {
      toggleShowSearchModal()
    }
    addIpcListener('search', handler)
    return () => {
      removeIpcListener('search', handler)
    }
  }, [toggleShowSearchModal])

  // Sidebar related items - properly implement after mapping
  const { generalStatus, setGeneralStatus } = useGeneralStatus()
  const { popup } = useContextMenu()
  const [showSpaces, setShowSpaces] = useState(false)
  const [sidebarState, setSidebarState] = useState<SidebarState | undefined>(
    'tree'
  )
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('')

  const openState = useCallback((state: SidebarState) => {
    setSidebarState((prev) => (prev === state ? undefined : state))
  }, [])
  const { toggleShowingCloudIntroModal } = useCloudIntroModal()

  const toolbarRows: SidebarToolbarRow[] = useMemo(() => {
    return mapToolbarRows(
      storage,
      showSpaces,
      setShowSpaces,
      openState,
      openTab,
      toggleShowingCloudIntroModal,
      sidebarState
    )
  }, [
    openState,
    openTab,
    showSpaces,
    sidebarState,
    storage,
    toggleShowingCloudIntroModal,
  ])

  const localSpaces = values(storageMap)
  // const storages = useMemo(() => {
  //   return mapStorages(push, localSpaces, storage)
  // }, [localSpaces, push, storage])
  const sidebarResize = useCallback(
    (width: number) => setGeneralStatus({ sideBarWidth: width }),
    [setGeneralStatus]
  )
  const setSearchQuery = useCallback((val: string) => {
    setSidebarSearchQuery(val)
  }, [])

  const historyItems = useMemo(() => {
    return mapHistory(
      // implement history items for search
      [],
      push,
      storage.noteMap,
      storage.folderMap,
      storage
    )
  }, [push, storage])
  const { submit: submitSearch, sending: fetchingSearchResults } = useApi<
    { query: any },
    { results: NoteSearchData[] }
  >({
    api: ({ query }: { query: any }) => {
      // return new Promise(() => {
      return Promise.resolve({
        results: getSearchResultItems(storage, query.query),
      })
      // })
    },
    cb: ({ results }) => {
      // console.log('got results', results)
      setSearchResults(mapSearchResults(results, push, storage))
    },
  })

  const [isNotDebouncing, cancel] = useDebounce(
    async () => {
      if (storage == null || sidebarSearchQuery.trim() === '') {
        return
      }

      if (fetchingSearchResults) {
        cancel()
      }

      const searchParams = sidebarSearchQuery
        .split(' ')
        .reduce<GetSearchResultsRequestQuery>(
          (params, str) => {
            if (str === '--body') {
              params.body = true
              return params
            }
            if (str === '--title') {
              params.title = true
              return params
            }
            params.query = params.query == '' ? str : `${params.query} ${str}`
            return params
          },
          { query: '' }
        )

      // todo: implement search history for local space
      // addToSearchHistory(searchParams.query)
      await submitSearch({ query: searchParams })
    },
    600,
    [sidebarSearchQuery]
  )

  const [searchResults, setSearchResults] = useState<SidebarSearchResult[]>([])
  const usersMap = new Map<string, AppUser>()
  const [initialLoadDone] = useState(true)
  const {
    sideBarOpenedLinksIdsSet,
    sideBarOpenedFolderIdsSet,
    sideBarOpenedStorageIdsSet,
    toggleItem,
    unfoldItem,
    foldItem,
  } = useSidebarCollapse()

  const getFoldEvents = useCallback(
    (type: CollapsableType, key: string) => {
      return {
        fold: () => foldItem(type, key),
        unfold: () => unfoldItem(type, key),
        toggle: () => toggleItem(type, key),
      }
    },
    [foldItem, unfoldItem, toggleItem]
  )
  const {
    updateFolder,
    updateDocApi,
    createFolder,
    createDocApi,
    deleteFolderApi,
    toggleDocArchived,
    toggleDocBookmark,
    deleteStorageApi,
  } = useLocalDB()
  const {
    openWorkspaceEditForm,
    openNewDocForm,
    openRenameFolderForm,
    openRenameDocForm,
    // deleteWorkspace,
  } = useLocalUI()
  const { draggedResource, dropInDocOrFolder, dropInWorkspace } = useLocalDnd()
  const tree = useMemo(() => {
    return mapTree(
      initialLoadDone,
      generalStatus.sidebarTreeSortingOrder,
      storage,
      storage.noteMap,
      storage.folderMap,
      storage.tagMap,
      pathname,
      sideBarOpenedLinksIdsSet,
      sideBarOpenedFolderIdsSet,
      sideBarOpenedStorageIdsSet,
      toggleItem,
      getFoldEvents,
      push,
      toggleDocBookmark,
      deleteStorageApi,
      toggleDocArchived,
      deleteFolderApi,
      createFolder,
      createDocApi,
      draggedResource,
      dropInDocOrFolder,
      (id: string) => dropInWorkspace(id, updateFolder, updateDocApi),
      openRenameFolderForm,
      openRenameDocForm,
      openWorkspaceEditForm
    )
  }, [
    initialLoadDone,
    generalStatus.sidebarTreeSortingOrder,
    storage,
    pathname,
    sideBarOpenedLinksIdsSet,
    sideBarOpenedFolderIdsSet,
    sideBarOpenedStorageIdsSet,
    toggleItem,
    getFoldEvents,
    push,
    toggleDocBookmark,
    deleteStorageApi,
    toggleDocArchived,
    deleteFolderApi,
    createFolder,
    createDocApi,
    draggedResource,
    dropInDocOrFolder,
    openRenameFolderForm,
    openRenameDocForm,
    openWorkspaceEditForm,
    dropInWorkspace,
    updateFolder,
    updateDocApi,
  ])

  const activeBoostHubTeamDomain = useMemo<string | null>(() => {
    if (routeParams.name !== 'boosthub.teams.show') {
      return null
    }
    return routeParams.domain
  }, [routeParams])

  const spaces = useMemo(() => {
    const onSpaceLinkClick = (event: MouseEvent, workspace: NoteStorage) => {
      event.preventDefault()
      navigate(workspace.id)
    }
    const onSpaceContextMenu = (event: MouseEvent, workspace: NoteStorage) => {
      event.preventDefault()
      event.stopPropagation()
      const menuItems: MenuItemConstructorOptions[] = [
        {
          type: 'normal',
          label: t('storage.rename'),
          click: async () => {
            prompt({
              title: `Rename "${workspace.name}" storage`,
              message: t('storage.renameMessage'),
              iconType: DialogIconTypes.Question,
              defaultValue: workspace.name,
              submitButtonLabel: t('storage.rename'),
              onClose: async (value: string | null) => {
                if (value == null) return
                await renameStorage(workspace.id, value)
              },
            })
          },
        },
        { type: 'separator' },
        {
          type: 'normal',
          label: t('storage.remove'),
          click: async () => {
            messageBox({
              title: `Remove "${storage.name}" storage`,
              message:
                storage.type === 'fs'
                  ? "This operation won't delete the actual storage folder. You can add it to the app again."
                  : t('storage.removeMessage'),
              iconType: DialogIconTypes.Warning,
              buttons: [t('storage.remove'), t('general.cancel')],
              defaultButtonIndex: 0,
              cancelButtonIndex: 1,
              onClose: (value: number | null) => {
                if (value === 0) {
                  removeStorage(storage.id)
                }
              },
            })
          },
        },
      ]
      openContextMenu({ menuItems })
    }
    const allSpaces = mapLocalSpaces(
      localSpaces,
      storage.id,
      onSpaceLinkClick,
      onSpaceContextMenu
    )
    generalStatus.boostHubTeams.forEach((boostHubTeam, index) => {
      allSpaces.push({
        label: boostHubTeam.name,
        icon: boostHubTeam.iconUrl,
        active: activeBoostHubTeamDomain === boostHubTeam.domain,
        tooltip: `${osName === 'macos' ? '⌘' : 'Ctrl'} ${
          entries(storageMap).length + index + 1
        }`,
        linkProps: {
          onClick: (event) => {
            event.preventDefault()
            push(`/app/boosthub/teams/${boostHubTeam.domain}`)
          },
        },
      })
    })

    return allSpaces
  }, [
    activeBoostHubTeamDomain,
    generalStatus.boostHubTeams,
    localSpaces,
    messageBox,
    navigate,
    prompt,
    push,
    removeStorage,
    renameStorage,
    storage.id,
    storage.name,
    storage.type,
    storageMap,
    t,
  ])

  return (
    <NavigatorContainer onContextMenu={openStorageContextMenu}>
      <Sidebar
        className={cc(['application__sidebar'])}
        showToolbar={true}
        showSpaces={showSpaces}
        onSpacesBlur={() => setShowSpaces(false)}
        toolbarRows={toolbarRows}
        spaces={spaces}
        //  maybe remove this and provide nothing?
        spaceBottomRows={buildSpacesBottomRows(push)}
        sidebarExpandedWidth={generalStatus.sideBarWidth}
        sidebarState={sidebarState}
        tree={tree}
        sidebarResize={sidebarResize}
        searchQuery={sidebarSearchQuery}
        setSearchQuery={setSearchQuery}
        // todo: add search history for local space (or use general search history when a shared component)
        searchHistory={[]}
        recentPages={historyItems}
        treeControls={[
          {
            icon:
              generalStatus.sidebarTreeSortingOrder === 'a-z'
                ? SidebarTreeSortingOrders.aZ.icon
                : generalStatus.sidebarTreeSortingOrder === 'z-a'
                ? SidebarTreeSortingOrders.zA.icon
                : generalStatus.sidebarTreeSortingOrder === 'last-updated'
                ? SidebarTreeSortingOrders.lastUpdated.icon
                : SidebarTreeSortingOrders.dragDrop.icon,
            onClick: (event) => {
              popup(
                event,
                Object.values(SidebarTreeSortingOrders).map((sort) => {
                  return {
                    type: MenuTypes.Normal,
                    onClick: () =>
                      setGeneralStatus({
                        sidebarTreeSortingOrder: sort.value,
                      }),
                    label: sort.label,
                    icon: sort.icon,
                    active:
                      sort.value === generalStatus.sidebarTreeSortingOrder,
                  }
                })
              )
            },
          },
        ]}
        // See why its not full width
        treeTopRows={
          storage == null ? null : (
            <Button
              variant='primary'
              size={'sm'}
              iconPath={mdiTextBoxPlusOutline}
              id='sidebar-newdoc-btn'
              iconSize={16}
              onClick={() =>
                openNewDocForm({
                  parentFolderPathname: '/',
                  workspaceId: storage.id,
                })
              }
            >
              Create new doc
            </Button>
          )
        }
        searchResults={searchResults}
        // todo: no users?
        users={usersMap}
        // todo: timeline rows implementation!
        timelineRows={[]}
        timelineMore={
          storage != null
            ? {
                variant: 'primary',
                // todo: implement timeline page - push open page with timeline
                onClick: () => push(getTimelineHref(storage)),
              }
            : undefined
        }
        sidebarSearchState={{
          fetching: fetchingSearchResults,
          isNotDebouncing: isNotDebouncing() === true,
        }}
      />
    </NavigatorContainer>
  )
}

export default NoteStorageNavigator

const NavigatorContainer = styled.nav`
  //flex: 0 0 auto;
  //min-width: 0;
`

// const ScrollableContainer = styled.div`
//   flex: 1;
//   padding: 8px;
//   overflow: auto;
// `

// const TopButton = styled.button`
//   height: 50px;
//   display: flex;
//   flex-direction: row;
//   align-items: center;
//   cursor: pointer;
//   text-align: left;
//   padding: 0 16px;
//   border: none;
//   color: ${({ theme }) => theme.colors.text.secondary};
//   background-color: transparent;
//   margin: 4px 0;
//   & > .topButtonLabel {
//     font-size: 14px;
//     padding-right: 4px;
//     ${textOverflow}
//   }
// `

// const NewNoteButton = styled.button`
//   margin: 4px 8px;
//   height: 28px;
//   color: ${({ theme }) => theme.colors.text.primary};
//   background-color: ${({ theme }) => theme.colors.variants.primary.base};
//   border: none;
//   border-radius: 3px;
//   cursor: pointer;
//   text-align: left;
//   align-items: center;
//   display: flex;
//   padding: 0 8px 0 4px;
//   font-size: 14px;
//   &:hover {
//     background-color: ${({ theme }) => theme.colors.background.secondary};
//     .extra {
//       display: flex;
//     }
//   }
//
//   & > .icon {
//     width: 28px;
//     height: 28px;
//     ${flexCenter};
//     flex-shrink: 0;
//     font-size: 20px;
//   }
//   & > .label {
//     white-space: nowrap;
//     flex-shrink: 0;
//   }
//   & > .extra {
//     display: none;
//     font-size: 12px;
//     margin-left: 5px;
//     ${textOverflow};
//     align-items: center;
//     & > .icon {
//       flex-shrink: 0;
//       margin: 0 4px;
//     }
//   }
// `
