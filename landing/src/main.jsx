import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PrivacyPage } from './components/PrivacyPage';
import { SupportPage } from './components/SupportPage';
import './index.css';

const path = window.location.pathname.replace(/\/+$/, '');
const Page = path === '/privacidad' ? PrivacyPage : path === '/soporte' ? SupportPage : App;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);
