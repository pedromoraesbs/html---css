 var idade = 17 
 console.log(`Você tem ${idade} anos.`)
if (idade < 16){
    console.log('NÃO VOTA')
}else if (idade < 18 || idade > 65 ){
    console.log('Voto Opicional')
}else {
    console.log('Voto Obrigatorio')
}