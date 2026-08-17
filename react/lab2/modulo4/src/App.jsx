import { Routes, Route, NavLink } from "react-router-dom"

import Home from "./pages/Home"
import Perfil from "./pages/Perfil"



function App() {
    return (
        <>
            <nav>
                <NavLink to="/" className={({isActive}) => isActive ? "ativo" : ""}>Home</NavLink>
                <NavLink to="/perfil" className={({isActive}) => isActive ? "ativo" : ""}>Perfil</NavLink>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/perfil" element={<Perfil />} />
            </Routes>
        </>
    )
}

export default App