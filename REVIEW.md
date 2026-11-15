# Revisão do repositório — 14/11/2026

Base revisada: `539bcdac4376c0c012d9945af4819fb0a29817c6`.
O inventário inicial contém 91 arquivos versionados, todos em texto.

## Cobertura

- Todos os arquivos versionados foram inventariados e lidos para validação de
  codificação; Python, JavaScript, JSON e scripts embutidos em HTML recebem
  verificação de sintaxe, sem executar código de aplicação ou payloads.
- Documentação, CSS, workflows e fontes C++ foram inspecionados como texto.
  Não se trata de prova formal nem de compilação dos pacotes nativos.
- A reconstrução baixa somente revisões fixadas. Os 181 arquivos protegidos
  de exploração e payloads são conferidos por SHA-256 e não foram modificados.
- O verificador cobre scripts gerados do host, idiomas, cache, loja e as duas
  entradas da prévia BX-GTA. Referências locais e manifestos precisam resolver
  para arquivos dentro do site. URLs externas não recebem prova de disponibilidade.
- As sete publicações principais mais recentes consultadas no Actions estavam
  concluídas com sucesso. A atualização completa automática do upstream
  continua exigindo validação e revisão; esta revisão não troca sua base.

## Correções

- A opção de payloads avançados e o atalho do diagnóstico não aparecem quando
  a área inferior está desativada. O carregamento não força essa preferência.
- O foco do teclado no diagnóstico usa os controles realmente disponíveis.
- JSON embutido em HTML é validado como dado, sem ser confundido com JavaScript.
  Scripts de módulo recebem a sintaxe apropriada.
- Referências locais com caracteres codificados são resolvidas corretamente;
  caminhos que escapem da pasta do site continuam rejeitados.
- Falhas de sintaxe passam a incluir detalhes úteis no log do verificador.
- As notas de cache, publicação e importação específica de 14.02 foram alinhadas
  ao comportamento atual.

## Resultado local

202 testes aprovados: 175 em JavaScript, incluindo verificações textuais da
interface nativa, e 27 em Python. O verificador abrange 93 arquivos de texto
no repositório atualizado, além dos arquivos gerados do site.

## Limites

Não foram executados payloads, exploração, desbloqueio, testes de temperatura,
controle físico ou instalação de PKGs. As fontes nativas não foram compiladas
nesta revisão. Os testes não confirmam que a falha relatada no PS4 13.52 foi
resolvida. Os binários, as cadeias, a aparência e os dois temas são preservados.
