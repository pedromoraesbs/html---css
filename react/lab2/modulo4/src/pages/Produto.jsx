import { useParams } from "react-router-dom"


function Produto() {

    const { id } = useParams()

    const produtos = [
        { id: 1, nome: "Notebook", preco: 3500 },
        { id: 2, nome: "Mouse", preco: 120 },
        { id: 3, nome: "Teclado", preco: 250 }
    ]

    const produtoEncontrado = produtos.find((produto) => produto.id === Number(id))

    if(!produtoEncontrado){
        return <h1>Produto não encontrado</h1>
    }


    return (
        <div>
            <h1>{produtoEncontrado.nome}</h1>
            <p>${produtoEncontrado.preco}</p>
        </div>
    )
}

export default Produto