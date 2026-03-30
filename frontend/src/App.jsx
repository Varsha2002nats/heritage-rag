import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SearchPage from './pages/SearchPage'

export default function App() {
  const [language, setLanguage] = useState('English')

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            language={language}
            onLanguageChange={setLanguage}
          />
        }
      />
      <Route
        path="/search"
        element={
          <SearchPage
            language={language}
            onLanguageChange={setLanguage}
          />
        }
      />
    </Routes>
  )
}
