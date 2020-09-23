import React, { useCallback } from 'react'
import { NoteStorage } from '../../lib/db/types'
import { secondaryButtonStyle, border } from '../../lib/styled/styleFunctions'
import styled from '../../lib/styled'
import { useRouter } from '../../lib/router'
import Icon from '../atoms/Icon'
import { mdiSync } from '@mdi/js'
import { useDb } from '../../lib/db'
import { useFirstUser } from '../../lib/preferences'
import { useToast } from '../../lib/toast'
import { useContextMenu, MenuItem, MenuTypes } from '../../lib/contextMenu'
import { useDialog, DialogIconTypes } from '../../lib/dialog'
import { useTranslation } from 'react-i18next'

const Container = styled.div`
  position: relative;
  height: 40px;
  width: 40px;
  margin-bottom: 5px;
  &:first-child {
    margin-top: 5px;
  }
`

const MainButton = styled.button`
  height: 40px;
  width: 40px;
  ${secondaryButtonStyle}
  ${border}
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`

const SyncButton = styled.button`
  height: 20px;
  width: 20px;
  border-radius: 10px;
  ${secondaryButtonStyle}
  background-color: ${({ theme }) => theme.navBackgroundColor};
  ${border}
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  bottom: -5px;
  right: -5px;
  z-index: 1;
`

interface AppNavigatorStorageItemProps {
  active: boolean
  storage: NoteStorage
  href?: string
}

const AppNavigatorStorageItem = ({
  active,
  storage,
  href,
}: AppNavigatorStorageItemProps) => {
  const { push } = useRouter()
  const { syncStorage, renameStorage, removeStorage } = useDb()
  const user = useFirstUser()
  const { pushMessage } = useToast()
  const { popup } = useContextMenu()
  const { prompt, messageBox } = useDialog()
  const { t } = useTranslation()

  const goToStorage = useCallback(() => {
    if (href == null) {
      return
    }
    push(href)
  }, [push, href])

  const syncing = storage.type !== 'fs' && storage.sync != null

  const sync = useCallback(() => {
    if (user == null) {
      pushMessage({
        title: 'No User Error',
        description: 'Please login first to sync the storage.',
      })
      return
    }
    syncStorage(storage.id)
  }, [user, pushMessage, syncStorage, storage.id])

  const openContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      const menuItems: MenuItem[] = [
        {
          type: MenuTypes.Normal,
          label: t('storage.rename'),
          onClick: async () => {
            prompt({
              title: `Rename "${storage.name}" storage`,
              message: t('storage.renameMessage'),
              iconType: DialogIconTypes.Question,
              defaultValue: storage.name,
              submitButtonLabel: t('storage.rename'),
              onClose: async (value: string | null) => {
                if (value == null) return
                await renameStorage(storage.id, value)
              },
            })
          },
        },
        {
          type: MenuTypes.Normal,
          label: t('storage.remove'),
          onClick: async () => {
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
        {
          type: MenuTypes.Normal,
          label: 'Configure Storage',
          onClick: () => push(`/app/storages/${storage.id}/settings`),
        },
      ]

      if (storage.type !== 'fs' && storage.cloudStorage != null) {
        menuItems.unshift({
          type: MenuTypes.Normal,
          label: 'Sync Storage',
          onClick: sync,
        })
      }

      popup(event, menuItems)
    },
    [
      popup,
      messageBox,
      prompt,
      renameStorage,
      removeStorage,
      storage,
      push,
      sync,
      t,
    ]
  )

  return (
    <Container
      title={storage.name}
      onClick={goToStorage}
      onContextMenu={openContextMenu}
    >
      <MainButton className={active ? 'active' : ''} onClick={goToStorage}>
        {storage.name.slice(0, 1)}
      </MainButton>
      {storage.type === 'pouch' && storage.cloudStorage != null && (
        <SyncButton className={syncing ? 'active' : ''} onClick={sync}>
          <Icon spin={syncing} path={mdiSync} />
        </SyncButton>
      )}
    </Container>
  )
}

export default AppNavigatorStorageItem
