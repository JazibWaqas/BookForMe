import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Homepage from './pages/Homepage'
import VendorPage from './pages/VendorPage'
import './App.css'

function App() {
  return (
    <div className="App">
      <VendorPage />
    </div>
  )
}

export default App
