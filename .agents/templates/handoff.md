# Passagem: wave [N], tarefa [ID]

> Um arquivo por tarefa. A mensagem para o agente leva só o caminho deste arquivo.
> Quem recebe começa em sessão limpa e lê daqui. Nada do que importa pode estar só no histórico de uma conversa.

## Para

- **Persona:** [nome exato da tabela do AGENTS.md]
- **Modelo:** [nível escolhido para este despacho, e por quê] (`MODELO_E_MOTIVO`)
- **Etapa no estado.md no momento do despacho:** [Ex, `ETAPA_NO_ESTADO_NO_DESPACHO`]
- **SPEC_SHA256:** [12 caracteres da aprovação, copiados do estado.md]
- **PLANO_SHA256:** [12 caracteres da aprovação, copiados do estado.md]

## Tarefa

- **ID:** T00
- **Descrição:** uma linha.
- **Files:** caminhos exatos. Você só toca nestes.
- **Depends-on:** IDs já commitados, ou `none`.
- **Verificação:** o comando, teste ou comportamento que prova que ficou pronto.

## Leia antes de começar

- SPEC: `docs/superpowers/specs/...` (seções: ...)
- Plano: `docs/superpowers/plans/...` (tarefa T00)
- Regras: `.agents/rules/ondas.md`, `.agents/rules/gates.md`

## Estado verificado

- **Verificado em:** [AAAA-MM-DD HH:MM] — o que foi conferido de fato (git status, branch, gates) e não só lembrado.
- **Evidência:** [comando e saída, ou caminho]
- **Recursos abertos:** [servidor, porta, banco, processo que ficou rodando; ou nenhum]
- **Contexto a revisitar:** [o que pode ter mudado desde que isto foi escrito]

## Critérios de aceite desta tarefa

- 

## Consultas feitas

- Vault:
- Grafo:
- Documentos:
- Estrutura:
- Context7:

## O que não fazer

- Não commitar.
- Não tocar em arquivo fora de `Files:`.
- 

---

## Relato (preenchido por quem executou)

> A resposta final do subagente segue o formato F3 (`.agents/rules/formatos.md`); esta seção guarda o mesmo conteúdo no arquivo.

- **Status:** CONCLUIDA | CONCLUIDA_COM_RESSALVA | PRECISA_CONTEXTO | BLOQUEADA
- **Arquivos tocados:**
- **Gates:** saída real de `lint`, `typecheck` e `test`

```
```

- **O que ficou de fora e por quê:**
- **Dúvidas ou suposições feitas:**
