# Versão consolidada BX-CT7

Esta edição preserva o WebKitty fixado em
`21c2d899c7381cc9f98e4dfb8da8504d2581b831`. O nome e os créditos de
cada cadeia, incluindo Afterglow no 14.00, continuam preservados. O perfil
isolado 14.02 está descrito em [FW1402.md](FW1402.md).

## O que permanece estável

- O endereço curto `https://ct7-bx.github.io` abre o host publicado em
  `https://ct7-bx.github.io/BX-CT7.github.io/`.
- O layout principal e a janela preta de configurações permanecem.
- O site consulta a publicação ao abrir e a cada 10 segundos. O navegador pode
  atrasar os temporizadores em segundo plano; não existe como garantir o
  intervalo quando o próprio navegador suspende a página.
- Uma atualização só começa após clicar em Atualizar agora. Uma consulta que
  falha não apaga uma atualização já confirmada; ficar offline bloqueia o botão.
- A consulta tem limite de espera também quando o WebKit não entrega o evento
  de timeout; os temporizadores pendentes são liberados ao sair da página.
- Se o retorno automático após salvar o cache for bloqueado, o site informa
  que o cache foi salvo e orienta usar o link Voltar ao site já existente.
- O retorno explícito da tela de cache não reabre imediatamente uma tentativa
  incompleta. O início normal do cache permanece para primeiras visitas.
- O aviso inicial que encaminhava ao HTTP de outro host foi removido.

## Manutenção sem mudar a versão publicada

Os testes agendados continuam reconstruindo e verificando o código fixado,
mas não geram outra publicação nem alteram o cache do usuário. A pesquisa de
novidades do WebKitty continua a cada seis horas; uma proposta só é aberta se
o candidato passar nos testes. A proposta exige revisão humana e não é
mesclada automaticamente. Não é necessário aceitar propostas para continuar
usando esta edição.

Uma publicação ocorre após uma alteração aprovada na main ou uma execução
manual do workflow de publicação. Para testar sem publicar, marque
`verify_only` na execução manual. Cada publicação preserva uma cópia completa
no artefato `bx-ct7-site-<commit>` por 90 dias. O relatório de roteamento dos
firmwares também fica nos artefatos das verificações.

## Verificações incluídas

A construção confere todos os bytes baixados em `src/` e `includes/payloads/`
antes e depois da personalização. O verificador compara o inventário completo,
SHA-256, sintaxe, referências locais, catálogos e manifestos offline. As
personalizações obrigatórias interrompem a construção se o upstream mudar
seus pontos de integração.

O carregamento de idiomas aceita somente os arquivos incluídos na edição,
tem limite de espera e tenta alternativas quando um arquivo falha. As
configurações permitem navegação por Tab, fechamento por Escape e retorno de
foco; a janela de diagnóstico mantém o controle do teclado quando aberta.

## Atualização de payloads

A versão GoldHEN 2.4b18.14 e o transporte com limite de espera estão
descritos em [PAYLOADS.md](PAYLOADS.md). As versões anteriores continuam
disponíveis; arquivos de kernel e payloads antigos permanecem intactos.

## Limites que os testes não resolvem

O maior firmware reconhecido nesta revisão é 14.02, em um perfil separado. Isso não significa que
qualquer versão inferior seja suportada, nem comprova desbloqueio no console.
As cadeias e payloads não são executados nos testes automatizados.

AppCache real, consumo de memória do navegador, estabilidade do kernel,
reinícios e ativação efetiva do HEN exigem testes em cada modelo e firmware de
PS4. Não houve teste físico nesta revisão. Uma página mostrar sucesso ou um
User-Agent simulado ser reconhecido não comprova execução no console.

## Se for necessário recuperar uma edição

1. Guarde o ZIP da edição e o arquivo de SHA-256 juntos, em armazenamento seu.
2. Para recuperar o site público, restaure o código de um commit aprovado no
   repositório principal e deixe o workflow executar os testes e publicar.
   Não é preciso trocar o link curto nem editar os binários.
3. No PS4, use Atualizar agora para receber a publicação. Se aparecer o aviso
   antigo de HTTP, escolha Cancelar e deixe Interromper JavaScript desmarcado.
4. Se o cache falhar, conserve a mensagem e use o diagnóstico; Voltar ao site
   permite voltar sem repetir imediatamente o mesmo download incompleto.

O ZIP é uma cópia estática. Abrir os arquivos diretamente no computador não
reproduz o ambiente do navegador do PS4 nem prova funcionamento do desbloqueio.

## Refinamentos de navegação e acessibilidade

O catálogo de homebrew reutiliza um resultado válido por até 30 segundos ao
reabrir a aba, reduzindo pedidos repetidos. Consultas travadas têm limite
independente do evento de timeout do WebKit; uma nova renderização cancela
a consulta e o temporizador anteriores. Catálogos sem projetos reconhecidos
usam os cartões de informação em vez de deixar a aba vazia.

A janela de configurações mantém o foco mesmo se não houver controles
visíveis. O idioma anunciado pelo documento e o seletor acompanham o idioma
realmente carregado, incluindo o retorno ao inglês em caso de falha.
Esses ajustes não modificam estilos, payloads ou cadeias de kernel.

## Tema GTA VI aprovado

O tema de cores aprovado é aplicado por `includes/css/gta-vi.css`, após os
estilos existentes. Altera fundos, cores, bordas e sombras; não altera
medidas, posições, tipografia, HTML dos controles ou funcionamento.
A página demonstrativa não é publicada. A folha participa dos manifestos e
da identificação de conteúdo offline para que Atualizar agora a receba.
