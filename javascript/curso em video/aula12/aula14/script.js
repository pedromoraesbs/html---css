function verificar() {
    var data = new Date ()
    var ano = data.getFullYear()
    var fano = document.getElementById('txtano')
    var res = document.getElementById('res')
    if (fano.value.length == 0 || Number(fano.value) > ano) {
        window.alert('Verifique os dados e tente novamente')
    } else{
        var fsex = document.getElementsByName('radsex')
        var idade = ano - Number(fano.value)
        var genero = ''
        var img = document.createElement('img')
        img.setAttribute('id', 'foto')
        if (fsex[0].checked){
            genero = 'Homem'
            if (idade >=0 && idade < 10){
                //criança
                img.setAttribute('src', 'menino.png ')
            }else if (idade < 25){
                //jovem
                img.setAttribute('src', 'jovenh.png')
            }else if(idade < 60){
                //adulto
                img.setAttribute('src', 'homen.png')
            }else{
                // idoso
                img.setAttribute('src', 'senhor.png')
            }
        }else if (fsex[1].checked) {
            genero = 'Feminino'
            if (idade >=0 && idade < 10){
                //criança
                img.setAttribute('src', 'menina.png')
            }else if (idade < 21){
                //jovem
                img.setAttribute('src', 'jovenm.png')
            }else if(idade < 60){
                //adulto
                img.setAttribute('src', 'mulher.png')
            }else{
                // idoso
                img.setAttribute('src', 'senhora.png')
            }
        }
        res.innerHTML = `Detectamos ${genero} com ${idade} anos.`}
        res.appendChild(img)
}