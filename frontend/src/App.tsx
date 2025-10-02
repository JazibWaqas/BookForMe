import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Homepage from './pages/Homepage'
import Chat from './pages/Chat'
import Social from './pages/Social'
import Notifications from './pages/Notifications'
import VendorPage from './pages/VendorPage'
import './App.css'

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/social" element={<Social />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/vendor/:id" element={<VendorPage />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
