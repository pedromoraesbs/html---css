import { NavLink, Outlet } from "react-router-dom"

function Layout(){
    return(
        <>
            <nav>
                <NavLink to="/perfil">Perfil</NavLink>
            </nav>

            <main>
                <Outlet />     
            </main>   
        </>
    )
}

export default Layout