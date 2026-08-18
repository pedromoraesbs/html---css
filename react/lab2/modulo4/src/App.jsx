import { Routes, Route, NavLink } from "react-router-dom"
import './App.css'

import Home from "./pages/Home"
import Perfil from "./pages/Perfil"
import Produto from "./pages/Produto"
import Produtos from "./pages/Produtos"



function App() {
    return (
        <>
            <nav>
                <NavLink to="/" className={({isActive}) => isActive ? "ativo" : "inativo"}>Home</NavLink>
                <NavLink to="/perfil" className={({isActive}) => isActive ? "ativo" : "inativo"}>Perfil</NavLink>
                <NavLink to="/produtos" className={({isActive}) => isActive ? "ativo" : "inativo"}>Produtos</NavLink>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="/produtos" element={<Produtos />} />
                <Route path="/produto/:id" element={<Produto />} />
            </Routes>
        </>
    )
}

export default App