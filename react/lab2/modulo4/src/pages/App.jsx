import Produto from "../componets/Produto"

function App() {
  const produtos = [
    { id: 1, nome: "Notebook", preco: 3500 },
    { id: 2, nome: "Mouse", preco: 120 },
    { id: 3, nome: "Teclado", preco: 250 }
  ]

  return (
    <>
      {produtos.map((produto) => (
        <Produto
          key={produto.id}
          nome={produto.nome}
          preco={produto.preco}
        />
      ))}
    </>
  )
}

export default App