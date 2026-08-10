import { Routes, Route } from "react-router-dom"

import Perfil from "./pages/Perfil"



function App() {



  return (
    <Routes>
       <h2>ola pagina principal...2</h2>
      
      <Route path="/perfil" element={<Perfil />} />
    
    </Routes>
  )
}

export default App