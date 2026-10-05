import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PrivacyPage } from './components/PrivacyPage';
import { SupportPage } from './components/SupportPage';
import { TermsPage } from './components/TermsPage';
import './index.css';

const path = window.location.pathname.replace(/\/+$/, '');
const PAGINAS = { '/privacidad': PrivacyPage, '/soporte': SupportPage, '/terminos': TermsPage };
const Page = PAGINAS[path] ?? App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);
