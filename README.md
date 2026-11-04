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
