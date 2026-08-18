import { Link } from "react-router-dom"

function Produtos() {

    const produtos = [
        { id: 1, nome: "Notebook", preco: 3500 },
        { id: 2, nome: "Mouse", preco: 120 },
        { id: 3, nome: "Teclado", preco: 250 }
    ]

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