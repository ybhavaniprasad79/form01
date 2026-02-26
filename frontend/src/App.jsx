import React from 'react'
import './App.css'
import Home from './pages/home'
import Animation from './pages/animation'
import Download from './pages/Download'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path='/' element={<Animation />} />
          <Route path='/home' element={<Home />} />
          <Route path='/download' element={<Download />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
