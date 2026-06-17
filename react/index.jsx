function Mybutton() {
    return (
        <button>Eu sou um botão</button>
    );
}

export default function Myapp() {
    return (
        <div>
            <h1>Bem vindo ao meu aplicativo</h1>
            <Mybutton />
        </div>
    );
}