import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Providers } from '@components/Providers'
import { HomePage } from '@pages/HomePage'

function App() {
  return (
    <Providers>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </div>
      </Router>
    </Providers>
  )
}

export default App
