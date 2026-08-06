import { useState } from "react"
import Campo from "./Campo"
import CampoNome from "./CampoNome"

function App() {

  const [nome, setNome] = useState("")
  const [idade, setIdade] = useState("")

  return (
    <>

      <h2>Nome: {nome}</h2>
      <CampoNome atualizarNome={setNome} />
      <h2>Idade: {idade}</h2>
      <Campo atualizarIdade={setIdade} />
    </>
  )
}

export default App