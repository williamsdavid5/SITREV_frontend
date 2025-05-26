import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home';
import Motoristas from './pages/Motoristas'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/motoristas' element={<Motoristas />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
