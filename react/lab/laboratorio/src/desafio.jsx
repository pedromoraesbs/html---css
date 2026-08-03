import { useState, useEffect, } from "react"


function Home() {
    const [usuarios, setUsuarios] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        async function buscarUsuarios() {
            try {
                const response = await fetch("https://jsonplaceholder.typicode.com/users")

                const dados = await response.json()

                setUsuarios([])
            } catch (erro) {
                console.log("Erro", erro)
            } finally {
                setLoading(false)
            }

        }
        buscarUsuarios()
    }, [])

    if (loading) {
        return <h1>Carregando Usuários...</h1>
    }
    
    if(usuarios.length === 0 ) {
        return <h1>Nenhum usuário encontrado.</h1>
    }


    return (
        <>
            {usuarios.map((usuario) => (

                <div key={usuario.id}>
                    <h2 >{usuario.name}</h2>
                    <p>{usuario.email}</p>
                    <p>{usuario.address.city}</p>
                </div>
            ))}

        </>
    )
}

export default Home