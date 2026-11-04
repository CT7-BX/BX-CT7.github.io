# BX-HEN Store — aplicativo nativo para PS4 (planejamento inicial)

**Estado:** projeto de implementação, não é um PKG compilado e testado.

## Objetivo

Criar uma loja homebrew original do BX-CT7, instalada no PS4 como aplicativo próprio, usando um catálogo remoto de PKGs autorais ou com autorização de distribuição. A experiência desejada é: iniciar o app no menu do PS4 → explorar o catálogo → visualizar versão/tamanho/licença/estado → baixar ou solicitar instalação conforme as capacidades disponíveis e comprovadas no console.

## Tecnologia

- **Ferramentas de build:** OpenOrbis PS4 Toolchain, a partir de um projeto de exemplo legítimo, com assets e código próprios.
- **Frontend:** interface nativa compatível com o PS4, com controle pelo DualShock.
- **Catálogo:** `https://ct7-bx.github.io/BX-CT7.github.io/bx-hen/store/catalog.json`.
- **Arquivos PKG:** HTTPS em serviço externo (por exemplo, armazenamento de objetos administrado pelo autor), fora do repositório de código.
- **Empacotamento:** título e `Content ID` próprios e únicos, independentes do aplicativo de referência.

## Etapas de implementação

1. **Base compilável:** adaptar o exemplo oficial de homebrew do OpenOrbis, com inicialização, renderização e entrada pelo controle.
2. **Catálogo:** buscar JSON por HTTPS com tratamento de timeout, erros, offline, paginação e suporte a conexão do PS4.
3. **Interface:** Home, Homebrew, Downloads, Detalhes, Configurações e Diagnóstico; todos os estados devem apresentar informações reais, sem botões fictícios.
4. **Segurança:** permitir somente PKGs autorizados, URLs HTTPS válidas, HTTPS de origem confiável, tamanho esperado, hash SHA-256 verificado após download, confirmação explícita e espaço livre suficiente; evitar comandos de instalação de conteúdo não autorizado.
5. **Transferência:** testar primeiro download resumível e armazenamento permitido em um PS4 de desenvolvimento autorizado.
6. **Instalação:** pesquisar integração com um serviço de instalação já disponível e autorizado no console. **O Package Installer local do GoldHEN não é, por si só, uma API de instalação remota.** Só habilitar o botão `Instalar` após a integração ter testes reais.
7. **Testes:** validação da compilação no CI; validação efetiva do PKG no PS4; registro da versão, resultados e compatibilidade.

## Estado do catálogo atual

- Minecraft Online Manager: entrada no catálogo, **PKG não localizado/publicado**.
- Java — projeto BX-CT7: entrada no catálogo, **PKG não localizado/publicado**.
- Não inventar URLs de download, IDs de produto, hashes ou confirmações de compatibilidade.

## Regras do projeto

- Preservar a identidade e o código original do aplicativo BX-HEN Store. Não copiar componentes proprietários ou recursos gráficos de outros aplicativos.
- Não confundir um `PKG` válido com a prova de que a loja funciona no firmware 13.53.
- Não publicar uma loja com título e conteúdo de terceiros. Não baixar automaticamente nem instalar sem consentimento.
- Não expor chaves, tokens e dados do usuário no PKG nem nos relatórios.
- Fluxo alternativo permitido: se a instalação remota não for possível, exibir uma orientação clara para usar o Package Installer com PKGs já presentes nas fontes que ele suporta, sem simular instalação.

## Referências técnicas

- OpenOrbis PS4 Toolchain: https://github.com/OpenOrbis/OpenOrbis-PS4-Toolchain
- Host e catálogo BX-HEN: https://ct7-bx.github.io/BX-CT7.github.io/bx-hen/store/

## Critérios de conclusão da versão 0.1

- Build reproduzível e PKG gerado por toolchain;
- Abre no PS4 sem crash;
- Navegação por controle;
- Lista obtida pela rede e exibida com mensagens de erro;
- Capacidade de conferir hash dos arquivos locais;
- **Não requer instalação automática nesta fase**.
