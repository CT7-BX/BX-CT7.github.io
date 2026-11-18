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

## Cache sem progresso

Após 90 segundos sem mensagem válida de progresso, a tela de cache informa
que a conclusão ainda não foi confirmada e mostra Tentar novamente. Não
cancela downloads, não reinicia automaticamente e aceita conclusão tardia.
O progresso retoma a apresentação normal; sair da página libera o temporizador.

## Área inferior desativada

A opção de exibir apenas a tela superior também interrompe a montagem de
cartões e a restauração das abas ocultas na inicialização. Os arquivos e os
carregadores permanecem preservados. O seletor HEN, as configurações, o cache
e o painel de progresso durante a execução continuam disponíveis.

## Temas selecionáveis

Configurações → Tema do site permite escolher Original (preto/cinza) ou
GTA VI. A escolha é aplicada sem recarregar e é lida antes de desenhar o corpo
da página. O padrão continua GTA VI para preservar a aparência atual.
A preferência é salva localmente; bloqueio do armazenamento informa a falha
sem impedir a troca. Mudanças são sincronizadas entre abas do mesmo navegador.
A folha GTA e o controlador estão disponíveis no cache offline com revisão
por conteúdo. A troca não muda layout, firmware, HEN ou payload selecionado.

## Robustez dos temas

As configurações informam o nome do tema ativo ao reabrir. Se a folha GTA VI
falhar, o seletor informa a falha e usa Original temporariamente sem apagar
a preferência salva. Uma opção que não carregou não é anunciada como aplicada.
Eventos de armazenamento da sessão não alteram a preferência de aparência.
A troca de tema não executa navegação nem altera foco, rolagem, HEN ou firmware.

## Auditoria de todos os fontes

A verificação abrange os arquivos versionados, os scripts gerados do host e
as páginas de prévia. As opções e o atalho para a aba Avançado são ocultos
quando o catálogo está desativado; a inicialização não força essa preferência.
O teclado do diagnóstico continua preso apenas aos controles disponíveis.
O relatório de escopo e os limites estão em [REVIEW.md](REVIEW.md).

## Cobertura de aparência do host

A preferência Original/GTA VI também cobre diagnóstico, Sobre, personalização,
seleção de temperatura, cache, página mínima e loja. Uma folha compartilhada
altera apenas pintura e cores, com caminhos relativos e revisão por conteúdo.
O controlador lê a mesma preferência nas páginas conectadas, antes do corpo.
Os manifestos incluem o novo arquivo para uso offline. Os iframes de cache são
internos e a antiga entrada BX-HEN redireciona ao host; a prévia BX-GTA mantém
sua identidade própria por ser um protótipo separado.

## Robustez do monitor e acessibilidade no navegador

O Test Monitor é apenas um visor de relatórios públicos do GitHub Actions:
não executa jailbreak, não se comunica com o kernel e não confirma HEN ativo.
A lista de execuções pode receber foco para rolagem por teclado/controle,
anuncia quando uma consulta está em andamento e preserva o histórico válido
quando a rede falha ou os dados recebidos são inválidos. Respostas maiores
que 128 Ki caracteres e campos de metadados excessivos são rejeitados antes
da atualização visual, reduzindo o risco de travamento no WebKit antigo.

No Centro de Compatibilidade, os controles têm área mínima de 44 px e foco
visível. Os testes de armazenamento usam chaves temporárias distintas e
removem suas próprias chaves; não devem substituir dados preexistentes.
Os testes automatizados simulam essas condições em navegador fictício.
A usabilidade física com DualShock e a permanência do cache no PS4 ainda
precisam de confirmação no console real.


## Verificação prévia de colisões nas revisões WebKitty

Antes de alterar o pin de uma revisão candidata, `scripts/upstream_update.py`
consulta a árvore completa do WebKitty e confere os caminhos reservados pelos
componentes fixados de firmware 14.02, GoldHEN e demais adicionais. Se houver
colisão, a proposta é marcada **BLOQUEADA**, `build.py` permanece intacto,
nenhuma PR automática é aberta e o resumo/artefato do Actions registra os
caminhos em conflito. Árvores incompletas ou inválidas também impedem a
aprovação automática.

O workflow pode concluir a **verificação** com êxito mesmo quando a proposta
é bloqueada: isso NÃO significa nova versão aprovada ou publicada. Resolver
conflitos exige revisão manual de bytes, hashes e compatibilidade, sem desligar
as proteções de sobrescrita. Candidatos sem colisão continuam sujeitos a
reconstrução, testes, verificação de integridade e revisão humana.



## Limite de tempo independente para o monitor

O histórico do GitHub Actions usa tanto o timeout nativo do XHR quanto um
temporizador independente de 12 segundos. Caso o WebKit antigo não dispare
`ontimeout`, a interface interrompe a consulta, libera o estado de carregamento
e preserva o último histórico válido. Atualizações manuais cancelam a requisição
e o temporizador antigos; retornos tardios não substituem resultados recentes.
Os testes automatizados cobrem tempo esgotado, respostas tardias, falha HTTP,
erro de rede e exceção ao enviar a consulta. Isso não envolve payloads nem
teste de desbloqueio no PS4.



## Revisão 17/11/2026 — loja, armazenamento e verificações nativas

A loja de PKGs encerra consultas após 12 segundos também quando o WebKit
não entrega o evento `ontimeout`. Quando a consulta falha, preserva o
catálogo válido anterior e tenta o recurso em cache somente uma vez. A
interface ignora respostas tardias e rejeita corpos superiores a 256 KiB.

Os diagnósticos do painel, health e compatibility preservam chaves existentes
do armazenamento, utilizam identificadores temporários diferentes e apagam
somente os itens criados por eles. Novos testes cobrem armazenamento
bloqueado, colisões e preservação das preferências.

O workflow principal executa testes estáticos dos aplicativos nativos
de demonstração. Esses testes não compilam PKG e não demonstram
funcionamento no PS4; a compilação nativa depende de toolchains externas
cujas revisões exigem revisão e pinagem em etapa separada.


## Revisão adicional do monitor e da loja

Quando o serviço do GitHub Actions não fornece histórico, o primeiro acesso
ao monitor mostra **Histórico indisponível** em vez de manter indefinidamente
"Aguardando relatório...". Se já há resultados válidos, eles permanecem na
tela durante indisponibilidade temporária. O catálogo de PKGs também tenta
uma cópia já armazenada em cache se receber um JSON inválido do servidor,
limitando a tentativa a uma única consulta extra, sem repetir requisições
indefinidamente. Testes automatizados cobrem recuperação e falha dupla.


## Ajustes de confiabilidade — visibilidade e armazenamento

O verificador de versões agora escuta `visibilitychange` em `document`,
conforme o comportamento do navegador. Isso permite suspender corretamente
as verificações com a aba oculta e retomá-las quando ela voltar a ficar
visível, com testes de regressão que despacham eventos pelo documento.

O módulo experimental de diagnóstico no navegador usa uma chave temporária
única para verificar `localStorage`, confirma que a chave não existe antes
de gravar e remove apenas o valor que criou, mesmo diante de erros. Os
valores anteriores (inclusive `bx-hen-diagnostic-test`) permanecem intactos.
Não há alterações de host, firmware, payload, kernel ou GoldHEN.


## Otimização de tráfego, catálogo e progresso

- O verificador da revisão publicada agora consulta a cada 30 segundos com a
  página visível (antes 10 segundos), mantendo verificação imediata ao abrir
  ou voltar ao site e nenhuma atualização automática do cache.
- O catálogo Homebrew limita o tamanho da resposta JSON a 256 KiB, evita
  títulos excessivos e preserva temporariamente o último catálogo validado
  quando uma nova consulta falha, mesmo após expirar o intervalo de frescor.
- O indicador do cache ignora porcentagens recebidas fora de ordem para não
  retroceder visualmente; 100% de download não é confundido com conclusão
  do cache, que exige evento específico da página controlada.
- Testes de regressão simulam instabilidade, respostas grandes, atualização
  de catálogo e eventos atrasados, sem execução de payloads ou kernel.


## Monitor de histórico e identificação de firmware

- O diagnóstico de firmware do navegador e o Centro de Compatibilidade passam
  a exigir dois dígitos após o ponto no User-Agent do PS4. Versões como
  `14.0` ou `13.005` não são apresentadas como versões canônicas; detectar
  `14.02` não significa afirmar que o desbloqueio funcione no console.
- O monitor de CI cancela consulta e temporizador ao sair da página. Ao voltar
  pelo histórico do navegador com a página restaurada, ele consulta uma vez,
  ignora respostas antigas e mantém o último relatório válido diante de falhas.
- O resumo do monitor usa singular e plural corretos, com testes para as duas
  formas. Nenhum payload, carregador ou componente do kernel foi modificado.


## Rodada adicional de resiliência de interface (PS4 WebKit)

- A consulta de release.json rejeita respostas acima de 16 KiB antes de
  analisar o JSON e ignora notificações duplicadas de rede enquanto já existe
  uma verificação pendente. Um erro não aciona atualização automaticamente.
- A página de progresso de cache cancela o redirecionamento automático ao
  sair da página, evitando um retorno tardio inesperado após a navegação ou
  restauração pelo histórico. A conclusão fica disponível e o usuário pode
  selecionar Voltar ao site manualmente.
- Os cards Homebrew limitam descrição, URL e licença para evitar criar DOM
  excessivo ou apresentar metadados malformados como downloads confirmados.
- Regressões simuladas verificam os limites, eventos de navegação e resposta
  atrasada. Testes locais/CI não substituem execução física no console.


## Consoles antigos: busca, controles e WebGL

- A busca da loja limita a consulta recebida na URL e no campo de pesquisa,
  reduzindo custo de filtragem e evitando parâmetros enormes após navegar
  por links. Buscas normais e termos com espaços continuam funcionando.
- O Centro de Compatibilidade classifica WebGL como indisponível (e não
  bloqueado) quando o navegador não tem sequer a função getContext.
- Botões pequenos do painel de diagnóstico oferecem área mínima de 44 px e
  foco visível para controle, teclado e tela sensível ao toque.
- Incluídos testes estáticos e simulações para preservar comportamento
  ES5, sem modificar o host de desbloqueio.


## Firmware evidence, diagnostics and staged releases (November 2026)

The existing copy-only diagnostic report now includes the reviewed firmware
support matrix without adding rows, menus or visual controls. The published
matrix distinguishes static host routing from physical PS4 tests. Copied
reports redact common network addresses and secret parameters and localize
extra compatibility messages to Portuguese, English or Spanish when possible.
Nothing is uploaded by the site.

The new AppCache inventory validates generated local references and publishes
a machine-readable report as a GitHub Actions artifact. It does **not** reset
the browser cache or guarantee that offline loading works on the console.

The `beta` branch is a verification channel that builds and tests without
Pages deployment; `main` remains the stable published channel. The owner
retains the current layout, colors and buttons. No GoldHEN files, kernel
components, payload bytes or unlocking chains are changed.


## Estabilidade de sessões longas e preservação do visual

- Ao trocar de idioma rapidamente, a solicitação anterior de script agora é
  cancelada imediatamente: temporizador e nó pendente são descartados sem
  aguardar oito segundos, e a seleção mais recente prevalece.
- Os cartões Homebrew liberam as referências do XHR, do temporizador e da
  função de cancelamento assim que uma consulta termina ou falha; respostas
  atrasadas continuam ignoradas. Isso reduz retenção desnecessária de memória.
- O teste `test_visual_baseline.py` compara as 14 fontes HTML/CSS existentes
  com o inventário Git revisado em `diagnostics/visual-baseline.json`.
  Mudanças futuras de aparência exigem uma atualização explícita da
  referência, permitindo identificar regressões visuais involuntárias.
- Essas alterações não mudam o layout, a interface visível, o GoldHEN,
  os payloads, a lógica do firmware ou as rotinas de desbloqueio.
- Testes no GitHub Actions verificam a implementação e os recursos estáticos;
  a estabilidade física no WebKit PS4 e em sessões offline requer teste real.


## Inventário integral das opções de firmware e GoldHEN

O site passa a gerar o relatório publicado de compatibilidade diretamente
das opções já existentes na interface e das funções de seleção do host.
Todos os firmwares do seletor e todas as versões GoldHEN exibidas são
auditados. A checagem exige que os arquivos locais existam e preserva
a rejeição explícita de versões sem perfil, como 13.53 e 14.01.

A seleção simulada de um binário indica apenas uma rota configurada no
código; não certifica funcionamento no console. Não são modificados:
firmware do PS4, opções visíveis do seletor, interface, HTML, CSS,
bytes de GoldHEN, kernel, payloads ou cadeia de desbloqueio.
