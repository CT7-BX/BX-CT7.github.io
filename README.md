# BX-CT7 PS4 Host — Recuperação

**🌐 Site oficial do host:** https://ct7-bx.github.io/BX-CT7.github.io/

**[Abrir BX-CT7 PS4 Host](https://ct7-bx.github.io/BX-CT7.github.io/)**

Repositório de reconstrução do **BX-CT7 PS4 Host**, baseado na revisão pública do [WebKitty](https://github.com/ArabPixel/WebKitty) (`6bdb9f764ba428978cb657a718296c3d6752e9b0`, 03/11/2026).

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

A página principal mostra a revisão carregada e o estado de rede informado pelo
navegador. O botão **Verificar atualização** consulta a revisão publicada somente
quando acionado. Se ela for diferente, use **Atualizar cache** com internet e
reabra o site. A revisão identifica os arquivos da página, não a ativação de HEN.

O painel de diagnóstico permite navegação por teclado, fecha com Esc e devolve
o foco ao controle de origem. Quando a cópia automática não é aceita pelo
navegador, o texto permanece selecionado para cópia manual ou fotografia.

O catálogo trata consultas concorrentes, timeout, respostas inválidas e catálogo
vazio. Uma falha de atualização preserva o último catálogo válido na página.
O layout inclui fallback para WebKit sem CSS Grid e nomes/hash longos no celular.

### Executar verificações

Requer Node.js com `node --test` e Python 3.9+:

```sh
node --test tests/*.test.cjs
python3 -m unittest discover -s tests -p 'test_*.py' -v
python3 build.py
node --test tests/hen-selection.integration.cjs
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
