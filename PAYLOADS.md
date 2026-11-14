# Atualização de payloads e transporte

## Origem fixada e revisão

GoldHEN v2.4b18.14 é importado sem modificação do
[WebKitty f4caa56](https://github.com/ArabPixel/WebKitty/tree/f4caa56a29c4598e1dbd5422c1a0ff83e2a1c5e3).
A integração original foi introduzida no
[commit bbc6c5b](https://github.com/ArabPixel/WebKitty/commit/bbc6c5b5b0423b5623f0054b881f4c2eb3ba03a0).

O arquivo tem 298776 bytes e hash Git blob
`2d04ed98d2af86677472278d47eefa1fec45bb48`, conferido antes de gravar.
O arquivo público `payload-update.json` registra sua origem. O inventário
SHA-256 continua protegendo todos os módulos e binários anteriores.

A nova versão é padrão para sessões sem preferência salva. Preferências
compatíveis anteriores continuam preservadas. A versão 13 permanece no menu,
com seu arquivo específico para o 14.02. Nesse firmware só 13 e 14 são
aceitos, conforme o controlador atual do upstream. As opções anteriores
continuam disponíveis para seus respectivos firmwares; nenhum suporte novo
é presumido a partir do número da versão.

A correção original que limita Elf Loader até 14.00 é aplicada ao catálogo,
conforme o [commit 8c8ee71](https://github.com/ArabPixel/WebKitty/commit/8c8ee71bc7622dcb80713889029d6a16c8a269ab).
PS4HEN e nexHEN não foram substituídos por binários sem atualização revisada.
As cadeias WebKit/kernel existentes não são alteradas.

## Funcionamento

O transporte do host para download e envio BIN/ELF usa um resultado por
consulta, limite de espera por temporizador ES5 e cancelamento antes de
comunicar timeout. Não faz reenvio automático. Respostas atrasadas são
ignoradas. Arquivos vazios não são enviados; erros HTTP mantêm o estado para
o fluxo de diagnóstico existente. Os bytes recebidos são enviados intactos.

Todos os manifestos que já incluem GoldHEN passam a incluir a versão 14 e
sua identificação de origem. O desenho e os estilos permanecem; o seletor
existente passa a mostrar a versão 14 e conserva a 13 em Outras versões.

## Validação e limites

Testes simulam sucesso, arquivo vazio, HTTP 404/500, falha de construção,
falha de envio, timeout, cancelamento e resposta tardia. Também conferem
seleção por firmware, retorno à versão 13, hashes e presença offline.
Respostas HTTP de sucesso confirmam transporte, não a execução do payload.
Não houve teste físico nem comprovação de desbloqueio no PS4.

## Retorno à interface

A conclusão mantém o processamento original e restaura as seções escondidas
pelo controlador do host. Ao voltar pelo histórico, a rolagem é recolocada
no início. Uma posição que ultrapassa a altura da página também é corrigida.
Não há reenvio, nova tentativa automática ou mudança da detecção de sucesso.
Durante uma cadeia ativa, o retorno não interfere na interface. Essa correção
cobre o estado oculto encontrado no código; a foto não permite confirmar
outras causas de falha de renderização do navegador do PS4.
