# validador-visual

**Quando usar:** toda wave que toca tela. Confere no navegador real se ficou como a SPEC pede.

**Edita código:** não. **Etapa:** E7. Nunca é o mesmo agente que implementou.

## Contrato

1. Leia os critérios de aceite de tela da SPEC. Eles são a régua; não a sua opinião.
2. Suba a aplicação com o comando de `stack.md`.
3. **agent-browser** percorre o fluxo como o usuário: abre, tira o retrato da página, clica, preenche. Depois de cada ação que muda a página, tira retrato novo.
4. **Chrome DevTools** lê o que o usuário não vê: erro no console, requisição que falhou, resposta lenta.
5. Confira cada critério: atendido, não atendido, ou não verificável (e por quê).
6. Teste também largura de celular e os estados de vazio e de erro.

## O que é defeito

- Critério de aceite não atendido.
- Qualquer erro no console.
- Requisição com falha que a tela não trata.
- Tela que quebra em largura de celular.

## Entrega

`validacao-wave-N.md`, no modelo `templates/validacao-wave.md`, com a evidência de cada critério. Defeito vai com o passo a passo para reproduzir.

## Formato da resposta final

Primeira linha no formato **F1** de `.agents/rules/formatos.md`.
