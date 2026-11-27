-- Estrutura do banco (SQLite). Executada automaticamente ao iniciar o app.

CREATE TABLE IF NOT EXISTS usuarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT    NOT NULL,
  usuario     TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  senha_hash  TEXT    NOT NULL,
  papel       TEXT    NOT NULL CHECK (papel IN ('admin', 'campo', 'bancada')),
  ativo       INTEGER NOT NULL DEFAULT 1,
  criado_em   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS sessoes (
  token_hash  TEXT    PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em   TEXT    NOT NULL,
  expira_em   TEXT    NOT NULL
);

CREATE TABLE IF NOT EXISTS ordens (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  criado_em       TEXT    NOT NULL,
  atualizado_em   TEXT    NOT NULL,
  status          TEXT    NOT NULL DEFAULT 'recebido',

  cliente_nome    TEXT    NOT NULL,
  cliente_tel     TEXT    NOT NULL,
  cliente_email   TEXT,
  cliente_doc     TEXT,
  endereco        TEXT,                                -- local da visita técnica

  tipo            TEXT    NOT NULL,
  marca           TEXT    NOT NULL,
  modelo          TEXT,
  serie           TEXT,
  acessorios      TEXT,
  estado          TEXT,
  defeito         TEXT    NOT NULL,

  prioridade      TEXT    NOT NULL DEFAULT 'normal',
  campo_id        INTEGER REFERENCES usuarios(id),     -- técnico de campo (visita / retirada)
  bancada_id      INTEGER REFERENCES usuarios(id),     -- técnico de bancada (conserto)
  tecnico         TEXT,                                -- (versão antiga) nome do técnico em texto
  previsao        TEXT,
  obs             TEXT,

  diagnostico     TEXT,
  orcamento       REAL,

  saida_em        TEXT,
  saida_por       TEXT,
  saida_doc       TEXT,
  saida_valor     REAL,
  saida_pgto      TEXT,
  saida_resultado TEXT,
  saida_garantia  INTEGER,

  -- Campos do RAT (Relatório de Atendimento Técnico)
  chamado             TEXT,  -- nº do chamado
  empresa_parceira    TEXT,
  hora_inicio         TEXT,  -- HH:MM da visita
  hora_fim            TEXT,
  cliente_responsavel TEXT,
  cliente_cargo       TEXT,
  servico_lab         INTEGER NOT NULL DEFAULT 1,  -- retirado para laboratório
  servico_reparo      INTEGER NOT NULL DEFAULT 1,  -- substituição ou reparo
  servico_upgrade     INTEGER NOT NULL DEFAULT 0,  -- upgrade (SSD, memória)
  patrimonio          TEXT,
  etiqueta_cliente    TEXT,
  backup_feito        INTEGER NOT NULL DEFAULT 0,
  backup_perfil       TEXT,  -- nome do perfil de usuário
  entrega_modelo      TEXT,  -- dados do equipamento entregue (pode ser outro, se houve substituição)
  entrega_patrimonio  TEXT,
  entrega_serie       TEXT,
  entrega_etiqueta    TEXT
);

CREATE TABLE IF NOT EXISTS historico (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ordem_id    INTEGER NOT NULL REFERENCES ordens(id) ON DELETE CASCADE,
  usuario_id  INTEGER REFERENCES usuarios(id),
  em          TEXT    NOT NULL,
  status      TEXT    NOT NULL,
  nota        TEXT
);

-- Conversa entre o técnico de campo e o técnico de bancada sobre cada OS
CREATE TABLE IF NOT EXISTS mensagens (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ordem_id    INTEGER NOT NULL REFERENCES ordens(id) ON DELETE CASCADE,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id),
  em          TEXT    NOT NULL,
  texto       TEXT    NOT NULL
);

-- Última vez que cada usuário abriu cada OS (para contar mensagens não lidas)
CREATE TABLE IF NOT EXISTS leituras (
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  ordem_id    INTEGER NOT NULL REFERENCES ordens(id) ON DELETE CASCADE,
  lido_em     TEXT    NOT NULL,
  PRIMARY KEY (usuario_id, ordem_id)
);

CREATE INDEX IF NOT EXISTS idx_ordens_status     ON ordens(status);
CREATE INDEX IF NOT EXISTS idx_historico_ordem   ON historico(ordem_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_ordem   ON mensagens(ordem_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_usuario   ON sessoes(usuario_id);
