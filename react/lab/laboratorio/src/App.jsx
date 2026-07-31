import { useState } from "react"
import './App.css'

function App() {
  const [contador, setContador] = useState(0)

  function aumentar() {
    setContador(prev => prev + 1)
  }

  function diminuir() {
    setContador(prev => prev - 1)
  }

  function aumentarDois() {
    setContador(prev => prev + 2)
  }


  const [nome, setNome] = useState("")
  const [idade, setIdade] = useState("")
  const [profissao, setProfissao] = useState("")

  function mudarNome(evento) {
    setNome(evento.target.value)
  }

  const pessoas = [
    { id: 1, nome: "Pedro" },
    { id: 2, nome: "Everton" },
    { id: 3, nome: "Gaby" },
    { id: 3, nome: "Simone" }
  ]


  const [logado, setLogado] = useState(false)

  return (
    <>
      <h1>{contador}</h1>
      <button onClick={aumentar}>+</button><br />
      <button onClick={diminuir}>-</button><br />
      <button onClick={aumentarDois}>+2</button><br />


      <input placeholder="Nome" value={nome} onChange={mudarNome} /><br />
      <input placeholder="Idade" value={idade} onChange={(evento) => {
        setIdade(evento.target.value)
      }} /><br />
      <input placeholder="Profissão" value={profissao} onChange={(evento) => {
        setProfissao(evento.target.value)
      }} />
      <h1>Nome: {nome}</h1>
      <h1>Idade: {idade}</h1>
      <h1>Profissão: {profissao}</h1>

      <button onClick={() => setLogado(!logado)}>Alterar</button>
      {logado ? <h1>Bem-vindo</h1> : <h1>Faça login</h1>}




      {
        pessoas.map((pessoa) => {
          return (
            <h2 key={pessoa.id}>{pessoa.nome}</h2>
          )
        })
      }
    </>
  )
}

export default App



