Regras do harness (versão 3)
1. Fluxo: E0 definição → E1 preparação → E2 consulta prévia → E3 SPEC → E3b revisão da SPEC (Codex) → aprovação da SPEC → E4 plano → aprovação do plano → E5 waves → E6 revisão interna → E7 navegador → E8 gates → E9 commit → E10 revisão final (Codex) → E11 memória → E12 merge → E13 deploy.
2. Aprovação é do humano, digitada por ele no terminal do Orquestrador: só "Aprovo a SPEC." e "Aprovo o plano.". Nenhum agente envia essas frases a outro terminal, e `maestri ask` nunca as leva.
3. O aviso entre agentes leva só o caminho de um arquivo. Ordens em docs/fluxo/<demanda>/ordens/, relatórios em .../relatorios/, material visual em .../assets-candidatos/. Nomes certos dos terminais: `maestri list`.
4. Só o Orquestrador (Claude Code) edita código, por subagentes, e commita.
5. Agente externo (Codex, Antigravity, OpenCode) responde em F9 e só escreve onde a ordem manda.
6. design-system/ é somente leitura; não execute o INSTALL.md nem o START.md dele.
7. Ninguém cria ou fecha terminais; Modo Maestro desligado.
8. Credenciais nunca vão em arquivo, nota ou mensagem.
9. Dúvida ou algo fora do seu papel: pare e pergunte ao humano.
