function CampoNome({ atualizarNome }) {
    return (
        <input onChange={(n) => atualizarNome(n.target.value)} />
    )
}

export default CampoNome