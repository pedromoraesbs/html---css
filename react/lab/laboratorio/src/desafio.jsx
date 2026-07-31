import { useState, useEffect, } from "react"


function Home() {
    const [usuarios, setUsuarios] = useState([])


    useEffect(() => {

        async function buscarUsuario() {
            try {
                const response = await fetch("https://jsonplaceholder.typicode.com/users")

                const dados = await response.json()

                setUsuarios(dados)
            } catch (erro) {
                console.log("Erro", erro)
            }

        }
        buscarUsuario()
    }, [])



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