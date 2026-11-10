# BX-HEN v2.2 / RUOK999 — viabilidade do menu interno do PS4

## Objetivo aprovado

Exibir **BX-HEN v2.2**, layout Neon e **Personalização: RUOK999** no **menu dentro de Configurações do PS4**, onde aparece `★ GoldHEN ★`. Manter os controles originais: Debug Settings, Cheat Settings, Plugin Settings, Game Overlay Settings, Servers Settings, Utilities, Settings e About.

**Estado: NÃO IMPLEMENTADO no menu do PS4.** As alterações já feitas no host WebKitty afetam somente o navegador; o aplicativo experimental `native-bxhen` é separado e também não substitui esse menu.

## Auditoria reproduzível concluída

- Workflow: https://github.com/CT7-BX/BX-CT7.github.io/actions/runs/42738706259
- Binário revisado: `includes/payloads/HEN/goldhen_v2.4b18.13.bin` da revisão fixa `ArabPixel/WebKitty@6bdb9f764ba428978cb657a718296c3d6752e9b0`.
- Tamanho: **297.496 bytes**.
- Git blob SHA-1: `682bea0de0be660d0522e018d3d250e7d1b7ee83` (**validado**).
- SHA-256: `39452f5e1c305ac9efcb4745eef7958b4db8c6d85299529f08700970b009ea4d`.
- Inspeção de cadeias UTF-8 / UTF-16: quatro ocorrências de `GoldHEN` em UTF-8, nenhuma correspondência direta aos nomes do menu de Configurações, `★ GoldHEN ★` ou `SiSTRo` nas codificações testadas.
- Não foram detectadas assinaturas conhecidas de PNG, JPEG, GIF, DDS, WebP ou ZIP incorporadas. Isso **não exclui** a existência de recursos comprimidos, cifrados ou construídos dinamicamente.
- A auditoria não alterou ou executou o payload. Resultado do workflow: **success**.

### Limitação técnica verificada

O repositório oficial informa que o código-fonte do GoldHEN é privado: https://github.com/GoldHEN/GoldHEN. A documentação oficial de plugins cobre extensões para jogos/aplicativos e não especifica uma API estável para substituir os elementos de `Configurações > GoldHEN`: https://github.com/GoldHEN/GoldHEN_Plugins_Repository.

**Portanto, não foi encontrada uma implementação pública verificada que faça o site reestilizar o menu do sistema mantendo as funcionalidades originais.** Não publicar um `.bin` modificado alegando compatibilidade sem validar uma implementação real.

## Critérios para uma implementação verdadeira

1. Obter a implementação do menu correspondente à versão usada, **ou** uma extensão/sistema de temas de menu documentado e compatível.
2. Garantir que os comandos do PS4 para cada item continuem apontando para as operações originais, e que as opções sigam selecionáveis pelo DualShock.
3. Aplicar BX-HEN v2.2 e RUOK999 apenas como **identidade de personalização**; manter autoria e licença do código original documentadas.
4. Compilar uma versão distinta, verificar estrutura do arquivo, integridade e capacidade de retornar ao payload original.
5. Validar em PS4 físico compatível, incluindo entrada/saída das Configurações, cada item, repouso e estabilidade.
6. Só depois publicar um arquivo destinado ao console, com changelog e versão própria.

## Não confundir

- **CSS/JS do host**: muda aparência no navegador, **não** o menu interno.
- **PKG separado**: abre aplicativo independente, **não** integra a opção ao menu do sistema.
- **Reescrever palavras no binário**: pode alterar comprimento, offsets, integridade e comportamento; não é prova de customização funcional.
- **Tema padrão do PS4**: muda recursos da interface do sistema, não garante mudança do menu integrado do GoldHEN.

Este relatório registra resultados reais. Não representa a conclusão da implementação visual solicitada no PS4.
