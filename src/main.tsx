import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter basename="/ai-career-frontend-9e871/">
        <App />
      </BrowserRouter>
    </StrictMode>
  );
} else {
  console.error("Fatal Error: Root element with id 'root' not found.");
}