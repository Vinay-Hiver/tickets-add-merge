import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import '../tokens/tokens.css';
import '../tokens/typography.css';
import '../index.css';
import '../omni/index.css';
import { CurrentUserProvider, AMY_USER } from '../omni/CurrentUser.jsx';
import { LinkedConversationsProvider } from '../omni/LinkedConversations.jsx';
import { ConversationFieldsProvider } from '../omni/ConversationFields.jsx';
import { EmailNotesProvider } from '../omni/EmailNotesStore.jsx';
import { ConversationViewerProvider } from '../omni/components/viewer/ConversationViewer.jsx';
import CoAssigneeApp from './CoAssigneeApp.jsx';

// /co-assignee.html: Amy's view for the co-assignee demo. A MemoryRouter, so the main nav can't leave this page.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MemoryRouter>
      <LinkedConversationsProvider>
        <ConversationFieldsProvider>
          <EmailNotesProvider syncKey="tam-co-assignee-notes">
            <CurrentUserProvider fixedUser={AMY_USER}>
              <ConversationViewerProvider>
                <CoAssigneeApp />
              </ConversationViewerProvider>
            </CurrentUserProvider>
          </EmailNotesProvider>
        </ConversationFieldsProvider>
      </LinkedConversationsProvider>
    </MemoryRouter>
  </StrictMode>,
);
