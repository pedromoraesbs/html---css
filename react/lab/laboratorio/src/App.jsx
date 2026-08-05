import { useState } from "react"

function Botao({ texto, acao }) {
  return (
        <button onClick={acao}>{texto}</button>
      )
}


export default function App() {

const [numero, setNumero] = useState(0)

function somar(){
  setNumero(prev => prev + 1)
}

function subtrair(){
  setNumero(prev => prev - 1)
}
  return (
    <div>
      <h1>{numero}</h1>
      <Botao texto="+" acao={somar} /><br />
      <Botao texto="-" acao={subtrair} />
    </div>
  )
}