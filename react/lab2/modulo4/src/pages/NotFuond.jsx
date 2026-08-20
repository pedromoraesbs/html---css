import { Link } from "react-router-dom"

function NotFuond(){
    return(
        <div>
            <h1>404</h1>
            <h2>Pgina não encontrada</h2>

            <Link to="/">Voltar para Home</Link>
        </div>
    )
}

export default NotFuond