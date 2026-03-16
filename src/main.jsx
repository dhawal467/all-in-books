import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { db } from './db/db.js'
import { seed } from './db/seed.js'

// Open the database and run the seed script
db.open().then(() => {
  seed();
}).catch(err => {
  console.error("Dexie DB Failed to open:", err);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
