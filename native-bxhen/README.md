# BX-HEN Neon — aplicativo nativo independente (prévia 0.1)

**Identidade visual:** BX-HEN v2.2 — **Personalização: RUOK999**.

Este diretório contém a primeira implementação **nativa para PS4** da interface Neon aprovada. Não é uma modificação do binário do GoldHEN nem substitui seus menus de sistema. O site BX-CT7/GitHub Pages continua intocado.

## Recursos presentes no código

- Desenho próprio em framebuffer de 1920×1080, cores ciano/roxo, molduras luminosas e emblema geométrico original.
- Identidade BX-HEN v2.2 e crédito RUOK999, sem substituir créditos/licenças de terceiros.
- Oito categorias visuais: Debug Settings, Cheat Settings, Plugin Settings, Game Overlay, Servers Settings, Klog Settings, Settings e About.
- Navegação DualShock 4: cima/baixo selecionam, X mostra detalhes, círculo volta, Options sai.
- Sem conexões de rede, comandos de kernel, download, gerenciamento de plugins, alteração do sistema ou execução de payloads.

**Importante:** as categorias são representações de interface. Apertar X não modifica as configurações reais do console. O GoldHEN original e suas funções continuam disponíveis pelo mecanismo já existente no console, de forma separada.

## Compilação experimental

O workflow [BX-HEN Neon — Native UI Test PKG](../.github/workflows/native-bxhen.yml) usa o OpenOrbis Toolchain e os exemplos públicos `samples/font`, `samples/input` e `samples/_common` para produzir um pacote **de teste** com identificador próprio (`BXHN00001`). Não reutiliza o Title ID nem os binários do GoldHEN.

O código principal é `main.cpp`. As fontes, controladores e bibliotecas do OpenOrbis são obtidos durante a execução do workflow. O uso do código de terceiros deve respeitar suas licenças; consulte [créditos e proveniência](THIRD_PARTY.md).

Um build de CI bem-sucedido confirma apenas compilação e empacotamento. **Não comprova que o app abre no PS4 13.53**. Antes de chamar uma versão de compatível, precisamos testar instalação, abertura, controle, saída e estabilidade no hardware.

### Etapas futuras, após testar a prévia

1. Testar a instalação e a renderização no PS4.
2. Substituir o emblema geométrico por arte original leve e otimizada para o console.
3. Adaptar menus e ações reais somente mediante APIs públicas verificadas, sem alterar o GoldHEN ou simular funcionalidade inexistente.
4. Registrar resultados e compatibilidade por firmware.

## Separação de versões

- **BX-HEN v2.2:** identidade visual escolhida pelo projeto.
- **UI Native 0.1:** primeira revisão independente da interface.
- **GoldHEN v2.4b18.13:** binário original usado pelo host existente, sem modificações.

Este aplicativo não é afiliado ao desenvolvedor do GoldHEN, não se apresenta como substituto do HEN e não remove os créditos do autor original.
