# Reconstrução do cache e dos carregadores do host

Esta alteração concentra a montagem em `host_runtime.py`. Ela substitui implementações antigas de cache e transporte, sem alterar os arquivos de kernel, payloads, CSS ou a estrutura visual das páginas. A reconstrução interrompe a publicação se detectar alteração nos estilos ou na estrutura HTML visível durante essa etapa.

## Comportamento

- A inicialização aguarda idioma, preferências e decisão do cache antes de permitir o início. Chamadas repetidas compartilham a mesma preparação.
- O coordenador acompanha uma execução por página. Navegação interrompida não reinicia a cadeia pelo histórico. Falha exige reabrir a página; não há novo fallback automático de exploração no transporte.
- A página mínima exige uma intenção de início de uso único, válida por dois minutos e vinculada à revisão, firmware, cadeia e payload. A primeira visita ao novo host limpa somente marcadores antigos de tentativa da sessão; mantém as preferências.
- O protocolo de cache 2 exige origem, janela e revisão corretas. Trocar o AppCache não é tratado como conclusão: o documento recarregado precisa confirmar a revisão. Progresso em 100% não basta.
- Recursos críticos recebem URLs baseadas no conteúdo, presentes nos manifests offline. A atualização do site permanece com a política vigente de 30 segundos enquanto visível; verificações são suspensas durante preparação e execução críticas.
- O transporte permite um envio por console, fixa o destino durante a operação, limita esperas e cancela continuações após navegação. Uma resposta HTTP não comprova execução. Resposta ausente não provoca reenvio nem uma nova exploração automática. O segundo arquivo PSVue só é enviado após a resposta aceita do primeiro.
- Os scripts mantêm a forma original de carregamento clássico/módulo e o sinal legado `script_loaded`, com espera limitada. Um timeout não consegue desfazer código que o navegador já executou.

## Validação automatizada

Foram aprovados 282 testes Node (277 do navegador/integração e cinco verificações estáticas do protótipo nativo), 43 testes Python, verificação de sintaxe/referências/fontes e inventário dos 14 manifests offline. A comparação com a montagem anterior encontrou zero alterações em 200 arquivos protegidos e estilos. A montagem também compara a estrutura HTML visível antes/depois da reconstrução.

Os cenários cobrem inicialização pendente, clique repetido, retorno pelo histórico, erro de troca de cache, revisão antiga, timeout, resposta atrasada, destino alterado, cancelamento de envio e descarte de URL temporária. A auditoria de firmware valida seleção de arquivos, não desbloqueio.

## Migração e limites

Atualizar o cache uma vez no navegador é necessário para substituir a publicação antiga; fechar e reabrir o host evita continuar um documento antigo pelo histórico. Não é necessário apagar as preferências. A migração não pode reparar uma aba que ainda está executando o JavaScript da publicação anterior.

Não houve teste físico no PS4. Permanecem pendentes no console 13.52: início e conclusão da cadeia, FAN 70 com GoldHEN ativo, retorno sem tela preta, primeiro cache e reabertura offline. As verificações não comprovam funcionamento em 14.00/14.02 nem adicionam suporte a firmware.

Referência de comparação/rollback: commit `a9ac6e149df8d91380ab88b1017f3c65d1c5f12d`. Para reverter, restaurar os arquivos desta alteração a partir dessa revisão e reconstruir, sem descartar mudanças posteriores não relacionadas.

O fluxo de confirmação considera o ciclo de atualização documentado pela [Apple para Application Cache](https://developer.apple.com/library/archive/documentation/iPhone/Conceptual/SafariJSDatabaseGuide/OfflineApplicationCache/OfflineApplicationCache.html). Essa documentação não substitui a validação no WebKit do PS4.
