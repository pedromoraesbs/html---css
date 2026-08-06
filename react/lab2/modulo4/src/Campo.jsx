function Campo({ atualizarIdade, atualizaNome }) {
    return (
        <>
            <input onChange={(e) => atualizarIdade(e.target.value)} />
            <input onChange={(n) => atualizarNome(n.target.value)} />
        </>
    )
}

export default Campo

// function CampoNome({ atualizarNome }) {
//     return (
//         <input onChange={(n) => atualizarNome(n.target.value)} />
//     )
// }

