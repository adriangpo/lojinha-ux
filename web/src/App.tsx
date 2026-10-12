import { Navigate, Route, Routes } from 'react-router'
import { Layout } from './componentes/Layout'
import { PaginaDoTema } from './componentes/PaginaDoTema'
import { Monitor } from './monitor/Monitor'
import { TEMAS } from './temas'

export function App() {
  return (
    <Routes>
      <Route path="/monitor" element={<Monitor />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to={`/${TEMAS[0].slug}`} replace />} />
        <Route path="/:slug" element={<PaginaDoTema />} />
      </Route>
    </Routes>
  )
}
