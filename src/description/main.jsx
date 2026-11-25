import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../tokens/tokens.css';
import '../tokens/typography.css';
import '../index.css';
import '../omni/index.css';
import { ConversationFieldsProvider } from '../omni/ConversationFields.jsx';
import Description from './Description.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConversationFieldsProvider>
      <Description />
    </ConversationFieldsProvider>
  </StrictMode>,
);
