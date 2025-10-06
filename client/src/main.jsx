import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';
import Modal from 'react-modal';

// Set axios base URL
axios.defaults.baseURL = 'http://localhost:8800';

// Set the app element for react-modal
Modal.setAppElement('#root');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
