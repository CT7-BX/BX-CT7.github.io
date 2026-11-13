# BX-CT7 PS4 Host — Recuperação

**🌐 Site oficial do host:** https://ct7-bx.github.io/BX-CT7.github.io/

**[Abrir BX-CT7 PS4 Host](https://ct7-bx.github.io/BX-CT7.github.io/)**

Repositório de reconstrução do **BX-CT7 PS4 Host**, baseado na revisão pública do [WebKitty](https://github.com/ArabPixel/WebKitty) (`21c2d899c7381cc9f98e4dfb8da8504d2581b831`, 11/11/2026).

Este repositório contém o **código de reconstrução e as personalizações**, não uma cópia integral do antigo repositório suspenso. O WebKitty e os seus arquivos binários são obtidos diretamente da origem pública durante a compilação.

## Reconstrução
Requer Python 3.9+ e conexão com a internet:

```sh
python3 build.py
python3 -m http.server 8000 --directory dist
```

O site gerado fica em `dist/`. No GitHub Pages, o workflow `Build BX-CT7 PS4 Host` faz a reconstrução e a publicação.

## Personalizações
- Interface com marca 🇧🇷 BX-CT7 e referência ao GitHub CT7-BX.
- Português brasileiro como idioma inicial, com compatibilidade condicionada às traduções presentes na revisão-base.
- Temas Rubi BX-CT7 e Brasil.
- Aviso de que o nexHEN é experimental (revisão 01/11/2026).
- Sem painel flutuante de atualizações do GoldHEN.
- Verificação da integridade do nexHEN e do carregador ELF.

**Importante:** a reconstrução não comprova que o HEN esteja ativo nem que funcione no firmware 13.53. Não substituímos arquivos de kernel/exploit nem desabilitamos as verificações de firmware.

## Proveniência
WebKitty é distribuído sob licença AGPL-3.0. A compilação preserva o `LICENSE` original. Alterações originais BX-CT7 ficam no código de personalização deste repositório.

Este é um backup de recuperação. Não é necessariamente idêntico, arquivo por arquivo, ao host anterior.

## Validação da interface

### Atualizações e diagnóstico

A página principal confere a publicação ao abrir, a cada 10 segundos e quando a
conexão retorna. A aplicação não pausa a contagem em abas ocultas; o navegador
pode atrasar ou suspender timers em segundo plano. Não há contador nem novos
controles. Consultas seguintes preservam o texto enquanto aguardam resposta,
sem piscar a mensagem de verificação. A saída da página e o início de uma
atualização encerram o timer; retornar pelo histórico restaura a verificação.
Ela mostra **Versão mais recente**, **Nova atualização disponível**
ou informa que não conseguiu verificar. O código da revisão fica apenas nos
diagnósticos. Quando existe uma publicação diferente, o único botão visível é
**Atualizar agora**: no PS4 com AppCache ele abre o fluxo de cache original;
nos demais navegadores recarrega a página. Não há download ou recarga automática.
A verificação identifica os arquivos da página, não a ativação de HEN.

O painel de diagnóstico permite navegação por teclado, fecha com Esc e devolve
o foco ao controle de origem. Quando a cópia automática não é aceita pelo
navegador, o texto permanece selecionado para cópia manual ou fotografia.

O catálogo trata consultas concorrentes, timeout, respostas inválidas e catálogo
vazio. Uma falha de atualização preserva o último catálogo válido na página.
O layout inclui fallback para WebKit sem CSS Grid e nomes/hash longos no celular.

A tela de cache mantém falhas visíveis, oferece **Tentar novamente** e
**Voltar ao site**, valida as mensagens do iframe e não anuncia sucesso se
a ativação do novo cache falhar. Seu comportamento real ainda depende de teste
no PS4 com AppCache; o navegador comum mostra quando essa API não existe.

Consultas de homebrews agora têm timeout e cancelam a requisição anterior ao
renderizar novamente. O histórico de CI valida a resposta antes de trocar a
lista visível. Uma indisponibilidade da API de histórico do GitHub é registrada
explicitamente e não impede a publicação de um site que passou nas verificações
de compilação e integridade.

### Executar verificações

Requer Node.js com `node --test` e Python 3.9+:

```sh
node --test tests/*.test.cjs
python3 -m unittest discover -s tests -p 'test_*.py' -v
python3 build.py
node --test tests/hen-selection.integration.cjs
node --test tests/language.integration.cjs
python3 diagnostics/verify_site.py
```

Pull requests executam os testes e a reconstrução sem publicar. Na branch `main`,
o Pages publica somente após essas verificações. Os manifests AppCache incluem
uma revisão calculada pelo conteúdo, também em builds locais.

A validação cobre sintaxe, referências locais, recursos de cache, catálogo e
regressões da interface. A apresentação mantém zoom disponível, foco visível e
margens compatíveis com WebKit sem flex gap. Aparência no PS4, navegação por
controle, persistência real do cache offline, payloads e desbloqueio exigem teste
físico separado; os testes automatizados não comprovam esses resultados.

## nexHEN experimental no firmware 13.52

O host mantém o nexHEN original da revisão fixada. Seu ELF e os dois arquivos
do carregador ELF entram nos manifests offline; o CI verifica hashes, assinatura
ELF, seleção do HEN e o reconhecimento da cadeia já existente para 13.52.
Essas verificações não comprovam que o payload suporta ou conclui a execução
nesse firmware. Não foram adicionados offsets nem alterações de kernel.

Se o processo não terminar, abra Configurações → Diagnóstico do Host /
Desenvolvedor → Copiar diagnóstico. O relatório local inclui payload selecionado,
estado e as últimas mensagens do host, sem enviar dados automaticamente.
Revise o relatório antes de compartilhar. Após atualizar o site, use Atualizar
cache com a rede disponível para receber a correção do cache do nexHEN.


## Integração nativa e atualizações do WebKitty

O firmware 14.00 usa a cadeia Slopkit Afterglow integrada ao WebKitty na própria
interface BX-CT7. A construção não baixa mais o repositório Afterglow separado
nem redireciona para outra página de entrada. O nome e os créditos da técnica
continuam preservados; esta integração não representa um exploit independente.
A revisão integrada mantém 13.52 em Relapse, conforme o upstream.

A cada seis horas, `Review WebKitty updates` consulta a revisão mais recente.
Quando encontra novidade, altera somente o SHA fixado, reconstrói o site e roda
os testes e a verificação de referências/cache. Apenas candidatos aprovados
nessas verificações geram uma proposta de atualização (pull request), com link
para a comparação completa e indicação de mudanças em kernel ou payloads.
Uma revisão que falha não é publicada; a execução no Actions mostra a falha.
Revisões já propostas, inclusive recusadas, não geram propostas repetidas.

A automação não mescla propostas. A revisão humana deve conferir a comparação,
os resultados dos testes e, quando necessário, o funcionamento no PS4. Após a
mesclagem, o fluxo normal de construção e publicação roda novamente. Propostas
criadas com o token do Actions não disparam outro workflow de pull request;
por isso a validação completa acontece antes da criação da proposta.
O GitHub precisa permitir que Actions crie pull requests neste repositório;
se essa política estiver desativada, a execução falha sem publicar alterações.

`upstream-integrity.json` registra a revisão e os SHA-256 dos arquivos de
exploração e payloads baixados. A construção falha se a personalização alterar
qualquer um desses arquivos. A nova revisão upstream atualiza também PS4Debug
para 1.3.3 e PS4-Xplorer para 2.09; os binários são os originais do WebKitty,
sem edição local. GoldHEN e nexHEN não foram modificados nesta integração.
Nenhum desses testes executa o desbloqueio ou comprova funcionamento físico.


## Robustez da edição de novembro

As personalizações obrigatórias agora interrompem a construção quando um
marcador do WebKitty muda. Nenhuma revisão que perca silenciosamente parte da
integração é publicada. O verificador também confere a lista completa e os
hashes dos arquivos protegidos contra o inventário gerado na construção.
O cálculo da revisão do cache lê arquivos em blocos e evita uma passagem
redundante antes de gerar os metadados finais.

A página e o JSON do catálogo local entram nos manifestos offline. Os cartões
Homebrew usam links com fragmento para manter a identidade do arquivo salvo.
A loja continua aceitando os links antigos com consulta; se a primeira consulta
falhar, tenta uma vez o catálogo salvo e avisa que ele pode estar desatualizado.
Essa inclusão no manifesto ainda precisa ser validada no AppCache real do PS4.

Falhas ao iniciar uma atualização devolvem o botão e a consulta periódica,
sem atualização automática. Os erros na preparação do cache ficam visíveis.
O diagnóstico mostra o estado do cache, a última linha do registro do host e
o resultado da consulta de atualização em português. O diálogo restaura a
rolagem anterior ao fechar e limpa mensagens antigas de cópia ao reabrir.

A rotina de revisão do WebKitty conserva o relatório da proposta como artefato
e no resumo do Actions mesmo se os testes do candidato falharem. Uma falha
continua impedindo a abertura da proposta e a publicação.
