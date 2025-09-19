// In src/main.tsx
import  { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter> {/* <-- NO BASENAME PROP */}
        <App />
      </BrowserRouter>
    </StrictMode>
  );
}