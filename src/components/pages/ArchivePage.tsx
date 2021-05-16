import { NoteStorage } from '../../lib/db/types'
import { getArchiveHref } from '../../lib/db/utils'
import Application from '../Application'
import { topParentId } from '../../cloud/lib/mappers/topbarTree'
import { mdiArchive } from '@mdi/js'
import { push } from 'mixpanel-browser'
import React from 'react'
import TrashDetail from '../organisms/TrashDetail'

interface ArchivePageProps {
  storage: NoteStorage
}

const ArchivePage = ({ storage }: ArchivePageProps) => {
  const archiveHref = getArchiveHref(storage)
  return (
    <Application
      storage={storage}
      content={{
        topbar: {
          breadcrumbs: [
            {
              label: 'Archive',
              active: true,
              parentId: topParentId,
              icon: mdiArchive,
              link: {
                href: archiveHref,
                navigateTo: () => push([archiveHref]),
              },
            },
          ],
        },
      }}
    >
      <TrashDetail storage={storage} />
    </Application>
  )
}

export default ArchivePage
