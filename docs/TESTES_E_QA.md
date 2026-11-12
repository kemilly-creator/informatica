# Plano de testes e QA

## Automatizados
- Catálogo: 46 registros, 24 Nacional, 22 Extensão, IDs únicos e campos obrigatórios.
- Domínio: notas inteiras 1–5 e pesos 30/30/25/15.
- Caso de referência: [4, 5, 4, 3] = 4,15.
- Busca: normalização de acentos sem alterar o título exibido.

## Votação (após backend)
- Mesmo código + projetos A e B: aceitar ambos.
- Mesmo código + mesmo projeto: aceitar apenas um.
- Duas requisições simultâneas para o mesmo par: uma gravação.
- Token inválido, votação fechada, projeto inexistente e notas inválidas: rejeitar.
- Retentativa com mesmo id_requisicao: idempotente.
- Confirmar somente com recibo e leitura posterior da linha.

## Ranking
Separar modalidades; calcular média ponderada de avaliações válidas; mínimo de cinco avaliações para colocação; empates determinísticos; não expor linhas privadas.

## Acessibilidade e dispositivos
Verificar larguras 320, 375, 768 e 1280 px; teclado, foco visível, contraste, mensagens de erro, alvos de toque e leitor de tela. Registrar o que foi efetivamente testado.

## Homologação manual
No endereço real do Pages, em janela anônima e celular: consultar ranking, enviar avaliação válida, receber recibo e conferir linha na planilha privada. Repetir o par código/projeto e confirmar bloqueio. Não gravar voto real de teste sem autorização.