import { useState } from 'react'
import './style.css'

import { toast, ToastContainer } from 'react-toastify';


function Home() {

  const [users, setUsers] = useState([]); 

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')

  const [tema, setTema] = useState("light")

      document.body.className = tema


    
    

  function cadastrarUsuario() {

    if(!name || !age || !email){
      toast.error("preencha todos os campos")
      return
    }
      toast.success("Usuario cadastrado com sucesso")
    novoUsuario

    const novoUsuario = {
      id: Date.now(),
      name,
      age,
      email,
    }

    setUsers([...users, novoUsuario])

    setName('')
    setAge('')
    setEmail('')

    
  }

  function removerUsuario(id){
    const novaLista = users.filter(user => user.id !== id)
    
    setUsers(novaLista)

    toast.success("Usuario Removido")
    
  }

  function alterarTema(){
    setTema(prev => prev === "light" ? "dark" : "light")
  }
  return (
    <>
      <button className='theme-button' onClick={alterarTema}>{tema === "light" ? "Tema Escuro" : "Tema Claro"}</button>

      <div className={`container ${tema}`}>

        <form>
          <h1>cadatro de usuario </h1>
          <input placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}  />

          <input placeholder="Idade"
            type='number'
            value={age}
            onChange={(e) => setAge(e.target.value)}  />

          <input placeholder="Email"
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}  />

          <button type='button' onClick={cadastrarUsuario}>Cadastrar</button>
        </form>

        {users.map(user => (
          <div key={user.id} className='card'>
            <div>
              <p>Nome: <span> {user.name}</span></p>
              <p>Idade: <span> {user.age}</span></p>
              <p>Email: <span> {user.email}</span></p>
            </div>
            <button onClick={()=> removerUsuario(user.id)}>
              <img src={Trash} />
            </button>
          </div>

        ))}

      </div>
      <ToastContainer theme={tema === "light" ? "light" : "dark"} />
    </>
  )
}

export default Home


