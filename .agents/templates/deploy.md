# Roteiro de deploy NN: [nome da demanda]

> Preparado pelo OpenCode (persona de infraestrutura) na E13, depois do merge. **Quem executa é o Gabriel.** O OpenCode escreve este roteiro e para.
> Arquivo: `docs/fluxo/<demanda>/deploy-NN.md`. Formatos: cabeçalho F1 e relatório F9 (`.agents/rules/formatos.md`).

PAPEL: [infra] | DEMANDA: [slug] | ETAPA: E13

- **Commit/merge a publicar:** [hash na `main`]
- **Ambiente:** [onde roda]
- **Data:**

## O que o OpenCode NÃO executa

Marque tudo que vale (o roteiro só descreve, o Gabriel roda):

- [ ] Nada de `docker`, `ssh`, `scp`, `git push`, migration, restart de serviço ou alteração de variável de ambiente
- [ ] Nenhuma credencial é lida, escrita ou colada neste arquivo
- [ ] Nenhum comando abaixo foi rodado pelo OpenCode (os `EXIT` do relatório F9 são só de leitura)

## Pré-condições

- [ ] A E12 (merge) está feita e a `main` tem o commit acima
- [ ] Gates passam na `main` (recibo ou pre-push do Gabriel)
- [ ] Janela combinada com quem usa: [quando]

## 1. Backup do banco (antes de qualquer coisa)

Use o comando do projeto. Para a Central Isobras:

```bash
docker exec central-isobras-db pg_dump -U postgres central_db > ~/backup-central-$(date +%Y%m%d).sql
```

Confira que o arquivo existe e tem tamanho maior que zero antes de seguir: `ls -lh ~/backup-central-*.sql`.

## 2. Passos

1. [passo com o comando exato, o que esperar na saída]
2. [próximo]
3. [migration, se houver: ordem e comando]

## 3. Teste rápido no ar

Três verificações que levam menos de cinco minutos e provam que subiu:

1. [URL ou comando e o resultado esperado]
2. [fluxo principal da demanda, um clique]
3. [log sem erro novo: comando]

Passou nos três: a demanda está entregue. Falhou em qualquer um: plano de volta.

## 4. Plano de volta

1. [como desfazer o código: comando exato]
2. [restaurar o banco do backup do passo 1, se a migration já rodou: comando]
3. [repetir o teste rápido para confirmar que voltou]

## Relatório (F9)

ESCREVI_EM: docs/fluxo/<demanda>/deploy-NN.md
COMANDOS_RODADOS: [só leitura, com EXIT n, ou nenhum]
O_QUE_NAO_FOI_VERIFICADO: [o que só o Gabriel confirma ao executar]
DECISAO_QUE_O_HUMANO_PRECISA_TOMAR: [ou nenhuma]
