import { Routes, Route } from "react-router-dom"

import Layout from "./components/Layout"

import PerfilInicio from "./pages/PerfilInicio"
import Perfil from "./pages/Perfil"
import Configuracoes from "./pages/Configuracoes"
import Seguranca from "./pages/Seguranca"

function App() {
    return (
        <Routes>

            <Route element={<Layout />}>

                <Route
                    path="/perfil"
                    element={<Perfil />}
                >
                    <Route index 
                    element={<PerfilInicio />} />

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