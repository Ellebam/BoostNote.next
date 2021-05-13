import React from 'react'
import { SidebarState } from '../../../../shared/lib/sidebar'
import { SidebarToolbarRow } from '../../../../shared/components/organisms/Sidebar/molecules/SidebarToolbar'
import {
  mdiClockOutline,
  mdiCogOutline,
  mdiFileDocumentMultipleOutline,
  mdiMagnify,
} from '@mdi/js'
import { PreferencesTab } from '../../../preferences'
import { NoteStorage } from '../../../db/types'
import RoundedImage from '../../../../shared/components/atoms/RoundedImage'

export function mapToolbarRows(
  workspace: NoteStorage,
  showSpaces: boolean,
  setShowSpaces: React.Dispatch<React.SetStateAction<boolean>>,
  openState: (sidebarState: SidebarState) => void,
  openSettingsTab: (tab: PreferencesTab) => void,
  sidebarState?: SidebarState
) {
  const rows: SidebarToolbarRow[] = []
  if (workspace != null) {
    rows.push({
      tooltip: 'Spaces',
      active: showSpaces,
      icon: <RoundedImage size={26} alt={workspace.name} />,
      onClick: () => setShowSpaces((prev) => !prev),
    })
  }
  rows.push({
    tooltip: 'Tree',
    active: sidebarState === 'tree',
    icon: mdiFileDocumentMultipleOutline,
    onClick: () => openState('tree'),
  })
  // Use fuzzy search for nav, and for global use global from local space (when global from cloud will be shared it can be used)
  rows.push({
    tooltip: 'Search',
    active: sidebarState === 'search',
    icon: mdiMagnify,
    onClick: () => openState('search'),
  })
  rows.push({
    tooltip: 'Timeline',
    active: sidebarState === 'timeline',
    icon: mdiClockOutline,
    onClick: () => openState('timeline'),
  })
  // provide import as link to settings for import (storage) or separate it as in cloud later
  // rows.push({
  //   tooltip: 'Import',
  //   icon: mdiDownload,
  //   position: 'bottom',
  //   onClick: () => openModal(<ImportModal />, { showCloseIcon: true }),
  // })
  rows.push({
    tooltip: 'Settings',
    active: sidebarState === 'settings',
    icon: mdiCogOutline,
    position: 'bottom',
    onClick: () => openSettingsTab('about'),
  })

  return rows
}
