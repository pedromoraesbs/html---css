function Campo({ atualizarIdade, atualizarNome }) {
    return (
        <>
            <input onChange={(e) => atualizarIdade(e.target.value)} /> <br />
            
        </>
    )
}

export default Campo

