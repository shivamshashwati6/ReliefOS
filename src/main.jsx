import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DisasterProvider } from './context/DisasterContext';
import { ReportProvider } from './context/ReportContext';
import { ZoneProvider } from './context/ZoneContext';
import { AllocationProvider } from './context/AllocationContext';
import { ResponsePlanProvider } from './context/ResponsePlanContext';
import { ResponseMonitoringProvider } from './context/ResponseMonitoringContext';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DisasterProvider>
          <ReportProvider>
            <ZoneProvider>
              <AllocationProvider>
                <ResponsePlanProvider>
                  <ResponseMonitoringProvider>
                    <App />
                  </ResponseMonitoringProvider>
                </ResponsePlanProvider>
              </AllocationProvider>
            </ZoneProvider>
          </ReportProvider>
        </DisasterProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
