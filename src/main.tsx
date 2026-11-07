import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/m-plus-rounded-1c/500.css';
import '@fontsource/m-plus-rounded-1c/700.css';
import '@fontsource/m-plus-rounded-1c/800.css';
import './styles.css';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('#root が見つかりません');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
