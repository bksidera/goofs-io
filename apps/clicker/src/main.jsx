import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@goofs/design-tokens/tokens.css';
import './index.css';
import Clicker from './Clicker.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Clicker />
  </StrictMode>
);
