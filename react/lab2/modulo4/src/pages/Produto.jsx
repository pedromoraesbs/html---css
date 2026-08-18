import { Link, useParams } from "react-router-dom"
import produtos from "../data/produtos"


function Produto() {

    const { id } = useParams()

    

    const produtoEncontrado = produtos.find((produto) => produto.id === Number(id))

    if(!produtoEncontrado){
        return <h1>Produto não encontrado</h1>
    }


    return (
        <div>
            <h1>{produtoEncontrado.nome}</h1>
            <p>${produtoEncontrado.preco}</p>
            <Link to={`/produtos`}>Voltar</Link>
        </div>
    )
}

export default Produto