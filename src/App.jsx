import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home';
import Motoristas from './pages/Motoristas'
import Alertas from './pages/Alertas';
import Veiculos from './pages/Veículos';
import Registros from './pages/Registros';
import './styles/global.css'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/motoristas' element={<Motoristas />} />
          <Route path='/veiculos' element={<Veiculos />} />
          <Route path='/alertas' element={<Alertas />} />
          <Route path='/registros' element={<Registros />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
