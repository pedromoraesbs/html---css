import { Routes, Route, NavLink } from "react-router-dom"
import './App.css'


import Layout from "./componets/Layout"
import Home from "./pages/Home"
import Perfil from "./pages/Perfil"




function App() {
    return (
        <>
           
            <Routes>
                <Route element={<Layout />}>

                    <Route path="/" element={<Home />} />
                    <Route path="/perfil" element={<Perfil />} />
                    <Route path="/produtos" element={<Produtos />} />
                    <Route path="/produto/:id" element={<Produto />} />

                </Route>

                <Route path="*" element={<NotFuond />} />

            </Routes>
        </>
    )
}

export default App