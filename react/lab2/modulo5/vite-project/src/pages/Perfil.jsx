import { Link, Outlet } from "react-router-dom"

function Perfil() {
    return (
        <>
            <h1>Perfil</h1>

            <nav>
                <Link to="configuracoes">
                    Configurações
                </Link>

                <Link to="seguranca">
                    Segurança
                </Link>
            </nav>

            <Outlet />
        </>
    )
}

export default Perfil