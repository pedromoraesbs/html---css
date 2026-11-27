// Popula o banco com usuários e ordens de exemplo: npm run seed
// Rode com o servidor parado. APAGA os dados existentes!
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "data");
fs.mkdirSync(dir, { recursive: true });
const arquivo = path.join(dir, "tecmanutencao.db");
for (const f of [arquivo, arquivo + "-wal", arquivo + "-shm"]) if (fs.existsSync(f)) fs.rmSync(f);

const db = new DatabaseSync(arquivo);
db.exec("PRAGMA foreign_keys = ON;");
db.exec(fs.readFileSync(path.join(process.cwd(), "lib", "schema.sql"), "utf8"));

// mesmo formato de lib/usuarios.ts
const hashSenha = (senha) => {
  const salt = crypto.randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${crypto.scryptSync(senha, salt, 64).toString("hex")}`;
};

const DIA = 86_400_000;
const iso = (diasAtras, horas = 0) => new Date(Date.now() - diasAtras * DIA + horas * 3_600_000).toISOString();
const dataCurta = (diasAFrente) => new Date(Date.now() + diasAFrente * DIA).toISOString().slice(0, 10);

/* ---------- Usuários ---------- */
const USUARIOS = [
  { nome: "Administrador", usuario: "admin", senha: "admin123", papel: "admin" },
  { nome: "Ana Paula", usuario: "ana", senha: "senha123", papel: "campo" },
  { nome: "Bruno Lima", usuario: "bruno", senha: "senha123", papel: "campo" },
  { nome: "Carlos Mendes", usuario: "carlos", senha: "senha123", papel: "bancada" },
  { nome: "Rafael Costa", usuario: "rafael", senha: "senha123", papel: "bancada" },
];
const insUser = db.prepare(
  `INSERT INTO usuarios (nome, usuario, senha_hash, papel, ativo, criado_em) VALUES (?, ?, ?, ?, 1, ?)`
);
const uid = {};
for (const u of USUARIOS) uid[u.usuario] = Number(insUser.run(u.nome, u.usuario, hashSenha(u.senha), u.papel, iso(40)).lastInsertRowid);

/* ---------- Ordens ---------- */
// st: [status, autor] em ordem; saida: [recebidoPor, valor, pgto, diasAtras, resultado?]
const exemplos = [
  { c: ["Mariana Souza", "(11) 98877-1122", "Rua das Flores, 120 — Barueri"], e: ["Notebook", "Dell", "Inspiron 15 3520", "BR-7HX92L3"], ac: "Carregador", d: "Não liga, LED de carga pisca laranja.", dias: 12, prev: -2, campo: "ana", bancada: "carlos", st: [["diagnostico", "carlos"], ["reparo", "carlos"]], orc: 380, diag: "Curto no circuito de carga. Troca do CI de carga." ,
    msgs: [["ana", 12, "Cliente comentou que o notebook caiu da mesa semana passada."], ["carlos", 10, "Ok, encontrei curto na placa. Já passei orçamento."]] },
  { c: ["Escritório Contábil Alves", "(11) 4199-3030", "Av. Brasil, 900, sala 12 — Osasco"], e: ["Impressora", "HP", "LaserJet Pro M428", "VNB3K12345"], ac: "Cabo de força, toner", d: "Atolando papel na bandeja 2 e manchando a impressão.", dias: 6, prev: 3, campo: "ana", bancada: "rafael", st: [["diagnostico", "rafael"], ["aprovacao", "rafael"]], orc: 520, prio: "alta", diag: "Rolete de tração gasto e fusor com sujeira. Troca do rolete + limpeza do fusor.",
    msgs: [["rafael", 4, "Ana, orçamento ficou R$ 520. Consegue confirmar com o cliente hoje? Eles pediram urgência."]] },
  { c: ["João Pedro Lima", "(11) 97766-5544", "Rua Itapeva, 55 — Carapicuíba"], e: ["Computador", "Montado", "Ryzen 5 / B550", ""], ac: "Nenhum", d: "Reinicia sozinho quando abre jogos.", dias: 4, prev: 5, campo: "bruno", bancada: "carlos", st: [["diagnostico", "carlos"], ["peca", "carlos"]], orc: 650, diag: "Fonte genérica não aguenta a carga. Substituir por fonte 650W 80 Plus.",
    msgs: [["carlos", 3, "Bruno, a fonte nova chega na quinta."], ["bruno", 3, "Beleza, aviso o cliente."]] },
  { c: ["Ana Beatriz Rocha", "(11) 96655-8899", "Alameda Rio Negro, 300 — Alphaville"], e: ["Monitor", "LG", "24MK430H", "SN204KX"], ac: "Fonte", d: "Tela pisca e apaga depois de alguns minutos.", dias: 9, prev: 0, campo: "bruno", bancada: "rafael", st: [["diagnostico", "rafael"], ["reparo", "rafael"], ["pronto", "rafael"]], orc: 210, diag: "Capacitores estufados na fonte interna. Substituídos.",
    msgs: [["rafael", 1, "Monitor pronto, testado por 2 horas sem desligar. Pode levar."]] },
  { c: ["Clínica Vida Plena", "(11) 4002-8922", "Rua Cel. Raposo, 77 — Barueri"], e: ["Nobreak", "SMS", "Station II 1400VA", ""], ac: "", d: "Bateria não segura carga.", dias: 1, prev: 4, campo: "ana", bancada: null, st: [], orc: null, msgs: [["ana", 1, "Equipamento da recepção da clínica, eles estão sem nobreak. Se der, priorizar."]] },
  { c: ["Lucas Ferreira", "(11) 95544-3322", "Rua Bahia, 410 — Jandira"], e: ["Notebook", "Lenovo", "IdeaPad 3", "PF3ZXK1"], ac: "Carregador, mochila", d: "Teclado com várias teclas falhando após derramar café.", dias: 15, prev: -5, campo: "bruno", bancada: "carlos", st: [["diagnostico", "carlos"]], orc: 290, msgs: [] },
  { c: ["Patrícia Gomes", "(11) 94433-2211", "Rua Itu, 18 — Santana de Parnaíba"], e: ["Impressora", "Epson", "EcoTank L3250", "X8KQ001"], ac: "Cabo USB", d: "Cabeça de impressão entupida, sai em branco.", dias: 20, prev: -10, campo: "ana", bancada: "rafael", st: [["diagnostico", "rafael"], ["reparo", "rafael"], ["pronto", "rafael"]], orc: 150, diag: "Limpeza profunda da cabeça e troca do almofadado.", saida: ["Patrícia Gomes", 150, "Pix", 8], msgs: [] },
  { c: ["Roberto Nunes", "(11) 93322-1100", "Rua XV, 1500 — Osasco"], e: ["Monitor", "Samsung", "S22F350", ""], ac: "", d: "Sem imagem, só liga o LED.", dias: 25, prev: -15, campo: "bruno", bancada: "carlos", st: [["diagnostico", "carlos"], ["aprovacao", "carlos"], ["semconserto", "bruno"]], orc: 480, diag: "Painel LCD danificado. Troca do painel custa quase o valor de um novo.", saida: ["Roberto Nunes", 50, "Dinheiro", 18, "semconserto"], msgs: [] },
];

const insOrdem = db.prepare(`INSERT INTO ordens (criado_em, atualizado_em, status, cliente_nome, cliente_tel, endereco, tipo, marca, modelo, serie,
  acessorios, defeito, prioridade, campo_id, bancada_id, previsao, diagnostico, orcamento,
  saida_em, saida_por, saida_valor, saida_pgto, saida_resultado, saida_garantia,
  hora_inicio, hora_fim, cliente_responsavel, cliente_cargo, patrimonio, etiqueta_cliente, backup_feito, backup_perfil,
  entrega_modelo, entrega_patrimonio, entrega_serie, entrega_etiqueta)
  VALUES (@criado, @atual, @status, @nome, @tel, @end, @tipo, @marca, @modelo, @serie, @ac, @d, @prio, @campo, @bancada,
  @prev, @diag, @orc, @saidaEm, @saidaPor, @saidaValor, @saidaPgto, @saidaRes, @saidaGar,
  @hi, @hf, @resp, @cargo, @patr, @etq, @bkp, @perfil, @eModelo, @ePatr, @eSerie, @eEtq)`);
const insHist = db.prepare(`INSERT INTO historico (ordem_id, usuario_id, em, status, nota) VALUES (?, ?, ?, ?, ?)`);
const insMsg = db.prepare(`INSERT INTO mensagens (ordem_id, usuario_id, em, texto) VALUES (?, ?, ?, ?)`);

const NOTAS = {
  semconserto: "Cliente RECUSOU o orçamento. Devolver sem conserto.",
  reparo: null,
};

const RESP = [["Mariana Souza", "Proprietária"], ["Fernanda Alves", "Gerente administrativa"], ["João Pedro Lima", "Proprietário"],
  ["Ana Beatriz Rocha", "Designer"], ["Dr. Paulo Mendes", "Diretor clínico"], ["Lucas Ferreira", "Estudante"],
  ["Patrícia Gomes", "Autônoma"], ["Roberto Nunes", "Comerciante"]];

db.exec("BEGIN");
let n = 0;
for (const x of exemplos) {
  n++;
  const passos = x.st.length;
  const saida = x.saida;
  const atualDias = saida ? saida[3] : Math.max(0, x.dias - passos * 2);
  const status = saida ? "entregue" : passos ? x.st[passos - 1][0] : "recebido";
  const id = Number(
    insOrdem.run({
      criado: iso(x.dias), atual: iso(atualDias), status,
      nome: x.c[0], tel: x.c[1], end: x.c[2], tipo: x.e[0], marca: x.e[1], modelo: x.e[2] || null, serie: x.e[3] || null,
      ac: x.ac || null, d: x.d, prio: x.prio || "normal", campo: uid[x.campo], bancada: x.bancada ? uid[x.bancada] : null,
      prev: dataCurta(x.prev), diag: x.diag ?? null, orc: x.orc,
      saidaEm: saida ? iso(saida[3]) : null, saidaPor: saida ? saida[0] : null, saidaValor: saida ? saida[1] : null,
      saidaPgto: saida ? saida[2] : null, saidaRes: saida ? saida[4] || "reparado" : null,
      saidaGar: saida && !saida[4] ? 90 : null,
      hi: `0${8 + (n % 2)}:${n % 2 ? "30" : "00"}`, hf: `${10 + (n % 3)}:15`,
      resp: RESP[n - 1][0], cargo: RESP[n - 1][1], patr: x.e[0] === "Computador" || x.e[0] === "Notebook" ? `PAT-${4500 + n}` : null,
      etq: `ETQ-${700 + n}`, bkp: x.e[0] === "Notebook" || x.e[0] === "Computador" ? 1 : 0,
      perfil: x.e[0] === "Notebook" || x.e[0] === "Computador" ? x.c[0].split(" ")[0].toLowerCase() : null,
      eModelo: saida ? [x.e[1], x.e[2]].filter(Boolean).join(" ") : null, ePatr: null,
      eSerie: saida ? x.e[3] || null : null, eEtq: saida ? `ETQ-${700 + n}` : null,
    }).lastInsertRowid
  );
  insHist.run(id, uid[x.campo], iso(x.dias), "recebido", "Equipamento retirado no cliente e recebido na loja.");
  x.st.forEach(([s, autor], i) => insHist.run(id, uid[autor], iso(Math.max(0, x.dias - (i + 1) * 2)), s, NOTAS[s] ?? null));
  if (saida) insHist.run(id, uid[x.campo], iso(saida[3]), "entregue", `Devolvido ao cliente — recebido por ${saida[0]}`);
  for (const [autor, dias, texto] of x.msgs) insMsg.run(id, uid[autor], iso(dias, 1), texto);
}
db.exec("COMMIT");
db.close();

console.log(`✔ Banco criado em ${arquivo}`);
console.log("  (os números de chamado são gerados quando o sistema abrir o banco)");
console.log("  Usuários de exemplo:");
for (const u of USUARIOS) console.log(`   - ${u.usuario.padEnd(7)} / ${u.senha.padEnd(9)} (${u.papel})`);
