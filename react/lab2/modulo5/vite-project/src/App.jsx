import { Routes, Route } from "react-router-dom"

import Layout from "./components/Layout"

import Home from "./pages/Home"
import Perfil from "./pages/Perfil"
import Configuracoes from "./pages/Configuracoes"
import Seguranca from "./pages/Seguranca"

function App() {
    return (
        <Routes>

            <Route element={<Layout />}>

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/perfil"
                    element={<Perfil />}
                >

                    <Route
                        path="configuracoes"
                        element={<Configuracoes />}
                    />

                    <Route
                        path="seguranca"
                        element={<Seguranca />}
                    />

                </Route>

            </Route>

        </Routes>
    )
}

export default App