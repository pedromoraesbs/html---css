- muito bom, mas o site ainda está estático (nginx, com arquivos html)
- agora, queremos hospedar via docker um SERVIÇO node (voce vai rodar o react via 'npm run start')
- vai salvar num repositorio github
- vai hospedar numa vps (porta 80 mesmo, http)
    pra isso, vc vai criar um proxy reverso (proxy pass) no nginx, além de ter colocado o container
- use o certbot para colocar httpS
- e por ultimo, nao vai peder sua luz entre as sombras do mundo
