import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'
import { RouterProvider } from './lib/router'
import { DialogProvider } from './lib/dialog'
import { combineProviders } from './lib/context'
import { DbProvider } from './lib/db'
import { PreferencesProvider } from './lib/preferences'
import { GeneralStatusProvider } from './lib/generalStatus'
import { PreviewStyleProvider } from './lib/preview'
import { ToastProvider } from './lib/toast'
import { AnalyticsProvider } from './lib/analytics'
import { StorageRouterProvider } from './lib/storageRouter'
import { SearchModalProvider } from './lib/searchModal'
import { CheckedFeaturesProvider } from './lib/checkedFeatures'
import { BoostHubStoreProvider } from './lib/boosthub'
import { CreateWorkspaceModalProvider } from './lib/createWorkspaceModal'
import { CloudIntroModalProvider } from './lib/cloudIntroModal'
import { MigrationProvider } from './lib/migrate/store'
import { V2ToastProvider } from './shared/lib/stores/toast'
import { V2WindowProvider } from './shared/lib/stores/window'
import { V2DialogProvider } from './shared/lib/stores/dialog'
import { V2ModalProvider } from './shared/lib/stores/modal'
import { V2ContextMenuProvider } from './shared/lib/stores/contextMenu'
import { V2SidebarCollapseProvider } from './lib/v2/stores/sidebarCollapse'

const V2CombinedProvider = combineProviders(
  V2SidebarCollapseProvider,
  V2ToastProvider,
  V2WindowProvider,
  V2ContextMenuProvider,
  V2ModalProvider,
  V2DialogProvider
)

const CombinedProvider = combineProviders(
  BoostHubStoreProvider,
  SearchModalProvider,
  PreviewStyleProvider,
  MigrationProvider,
  GeneralStatusProvider,
  DialogProvider,
  DbProvider,
  AnalyticsProvider,
  PreferencesProvider,
  StorageRouterProvider,
  RouterProvider,
  ToastProvider,
  CheckedFeaturesProvider,
  CreateWorkspaceModalProvider,
  CloudIntroModalProvider,
  V2CombinedProvider
)

function render(Component: typeof App) {
  let rootDiv = document.getElementById('root')
  if (rootDiv == null) {
    rootDiv = document.createElement('div', {})
    rootDiv.setAttribute('id', 'root')
    document.body.appendChild(rootDiv)
  }
  ReactDOM.render(
    <CombinedProvider>
      <Component />
    </CombinedProvider>,
    document.getElementById('root')
  )
}

if (module.hot != null) {
  module.hot.accept('./components/App', () => {
    render(App)
  })
}
render(App)
