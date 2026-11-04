# BX-HEN 0.1 — Diagnóstico experimental para PS4 13.53

Código-fonte próprio em C11 para **diagnóstico, sem exploração ou alterações no console**.

## Objetivo

Preparar uma base modular, auditável e testável para estudar a identificação de firmware 13.53. Não implementa desbloqueio, carregador de payload, acesso a kernel ou alteração de proteções. Não é GoldHEN nem contém código extraído dele.

## Estrutura

- `include/bx_firmware.h` — representação e análise de versão.
- `include/bx_diagnostics.h` — formato dos resultados.
- `src/bx_firmware.c` — reconhecimento estrito de versões e user-agent do PS4.
- `src/bx_diagnostics.c` — coleta de dados não invasivos sobre a execução.
- `src/main.c` — ferramenta de diagnóstico com saída legível.
- `tests/test_diagnostics.c` — casos automatizados de identificação, inclusive entradas inválidas.
- `Makefile` — compilação e testes.

## Como testar em computador

```sh
cd bx-hen
make test
make
./build/bx-hen-diag "Mozilla/5.0 (PlayStation 4 13.53) AppleWebKit/..."
```

A ferramenta é executada no computador e **analisa a string fornecida**, sem consultar nem alterar o PS4. Ela não confirma a compatibilidade de nenhum jailbreak com 13.53.

## Limites e próximos passos

O projeto **não executa** no kernel do PS4 e não usa APIs privadas do console. Versões de firmware só são declaradas detectadas se identificadas explicitamente na entrada. O alvo de estudo é 13.53, não uma alegação de suporte de jailbreak.

Foi mantido na branch `bx-hen-01353` para não alterar o BX-CT7 Host publicado até que os módulos sejam validados.
