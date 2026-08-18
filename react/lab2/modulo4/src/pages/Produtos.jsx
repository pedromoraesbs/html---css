import { Link } from "react-router-dom"
import produtos from "../data/produtos"

function Produtos() {


    return (
        <>
            <h1>Produtos</h1>

            {produtos.map((produto) => (
                <div key={produto.id}>

                    <h2>{produto.nome}</h2>

                    <Link to={`/produto/${produto.id}`}>
                        Ver produto
                    </Link>

                

                </div>
            ))}
        </>
    )
}

export default Produtos