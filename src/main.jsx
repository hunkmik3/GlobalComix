import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { env } from './lib/env.js';
import './styles.css';

document.title = env.appName;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
