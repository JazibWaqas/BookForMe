import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Homepage from './pages/Homepage'
import VendorPage from './pages/VendorPage'
import './App.css'

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/vendor/:id" element={<VendorPage />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
