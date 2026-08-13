import { Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import Perfil from "./pages/Perfil"



function App() {
    return (
        <>
            <nav>
                <Link to="/">Home</Link>
                <Link to="/perfil">Perfil</Link>
            </nav>

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/perfil" element={<Perfil />} />
            </Routes>
        </>
    )
}

export default App