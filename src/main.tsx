import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Agentation } from 'agentation'
import './tokens/tokens.css'
import './tokens/typography.css'
import './index.css'
import './omni/index.css'
import App from './omni/App.jsx'
import { CurrentUserProvider } from './omni/CurrentUser.jsx'
import { LinkedConversationsProvider } from './omni/LinkedConversations.jsx'
import { ConversationFieldsProvider } from './omni/ConversationFields.jsx'
import { ConversationViewerProvider } from './omni/components/viewer/ConversationViewer.jsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* Links are shared by everyone, so they sit outside the per-user view (which resets on switch). */}
      <LinkedConversationsProvider>
        <ConversationFieldsProvider>
          <CurrentUserProvider>
            <ConversationViewerProvider>
              <App />
            </ConversationViewerProvider>
          </CurrentUserProvider>
        </ConversationFieldsProvider>
      </LinkedConversationsProvider>
    </BrowserRouter>
    {import.meta.env.DEV && <Agentation appName="Omni Tickets - Add/Merge" />}
  </StrictMode>,
)
