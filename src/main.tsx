import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './auth';
import App from './App';
import './styles.css';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId) {
  document.getElementById('root')!.innerHTML =
    '<div style="padding:24px;font-family:sans-serif">Missing VITE_GOOGLE_CLIENT_ID. Copy <code>frontend/.env.example</code> to <code>frontend/.env</code> and fill it in.</div>';
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <GoogleOAuthProvider clientId={clientId}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </GoogleOAuthProvider>
    </StrictMode>,
  );
}
