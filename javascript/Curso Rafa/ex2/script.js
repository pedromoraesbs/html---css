function adicionarTarefa() {

//recebe o input
    const inputTarefa =document.getElementById("inputTarefa")
    let tarefa = inputTarefa.value.trim()

    const mensagem = document.getElementById("mensagem")

     //mensagem de erro 
    if (tarefa == ""){
        let mensageErro = "Digite uma tarefa pra ser incuida na lista "
        mensagem.textContent = mensageErro 

    }else{  

//mensagem de sucesso 
    let mensagemSucesso = "Tarefa adicionada com sucesso!";
    mensagem.textContent = mensagemSucesso;

    //cria a lista de tarefas
    const listaTarefa = document.getElementById("listaTarefa")
    let novaTaefa = document.createElement("li")

    novaTaefa.textContent = tarefa  

    listaTarefa.appendChild(novaTaefa)
    }   

    inputTarefa.value = ""
  
   //cor verde #28a745
   //cor vermelha #a34743
}