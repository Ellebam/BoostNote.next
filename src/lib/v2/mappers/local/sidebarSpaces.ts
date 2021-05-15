import { SidebarSpace } from '../../../../shared/components/organisms/Sidebar/molecules/SidebarSpaces'
import { osName } from '../../../../shared/lib/platform'
import { NoteStorage } from '../../../db/types'

export function mapLocalSpaces(
  localWorkspaces: NoteStorage[],
  activeWorkspaceId: string,
  linkOnClick: (event: any, workspace: NoteStorage) => void,
  linkOnContextMenu: (event: any, workspace: NoteStorage) => void
) {
  const spaces: SidebarSpace[] = []
  localWorkspaces.forEach((workspace, index) => {
    spaces.push({
      label: workspace.name,
      active: activeWorkspaceId === workspace.id,
      tooltip: `${osName === 'macos' ? '⌘' : 'Ctrl'} ${index + 1}`,
      linkProps: {
        onClick: (event) => linkOnClick(event, workspace),
        onContextMenu: (event) => linkOnContextMenu(event, workspace),
      },
    })
  })
  return spaces
}
