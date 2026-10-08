import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DisasterProvider } from './context/DisasterContext';
import { ReportProvider } from './context/ReportContext';
import { ZoneProvider } from './context/ZoneContext';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DisasterProvider>
          <ReportProvider>
            <ZoneProvider>
              <App />
            </ZoneProvider>
          </ReportProvider>
        </DisasterProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
