import { useState } from 'react'
import './App.css'
//import meuInput from './componentes/inputColorido.jsx'


const App = () => {

  const [primeiroDigito, mudaPrimeiroDigito] = useState(0)
  const [segundoDigito, mudaSegundoDigito] = useState(0)

  const dizeroi = () => alert('ola mundo arrow function...')
  const somarNumeros = () => {
    // let a = Number(document.getElementById('numa').value)
    // let b = Number(document.getElementById('numb').value)
    let operacao = document.getElementById('operacao').value
    let resultado;
      switch (operacao){
        case 'adicao':
          resultado = Number(primeiroDigito) + Number(segundoDigito)
          break;
        case 'subtracao':
          resultado = Number(primeiroDigito) - Number(segundoDigito)
          break;
        case 'multiplicacao':
          resultado = Number(primeiroDigito) * Number(segundoDigito)
          break;
        case 'divisao':
          if (segundoDigito === 0) {
            document.getElementById('resultado').innerHTML = 'Não é possivel dividir por zero';
            return;
          }
          resultado = Number(primeiroDigito) / Number(segundoDigito)
          break;      
        
    }
    document.getElementById('resultado').innerHTML = `O resultado é ${resultado}`;
  
 
  }


    const [meuContador, funcaoAlteraMeuContador ] = useState(1)


    // let meuContador = 1;

    // setInterval(() => {
    //   console.log('chamou o acrescimo do contador...')
    //   // meuContador++ 
    //   funcaoAlteraMeuContador(meuContador + 1)

    //   console.log({meuContador})

    // }, 3000)


  return (
    <>
      <div>
        <input onChange={(event) => {
          console.log({event})
          const novoValor = event.target.value
          console.log('tentei mudar o input')
          mudaPrimeiroDigito(novoValor)
          
          }} value={primeiroDigito} type="number" name="numa" id="numa" />
        <input onChange={(event) => {
          console.log({event})
          const novoValor = event.target.value
          mudaSegundoDigito(novoValor)
        }} value={segundoDigito} type="number" name="numb" id="numb" />
        <form>
          <select name="operacoes" id="operacao">
            <option value="adicao">Adição</option>
            <option value="subtracao">Subtração</option>
            <option value="multiplicacao">Multiplicação</option>
            <option value="divisao">Divisão</option>
          </select>
        </form>
        <button onClick={somarNumeros}>Calcular</button>
        <p id='resultado'></p>
        <h3>Contador: {meuContador}</h3>
        
         
      </div>
    </>

  )
}




export default App