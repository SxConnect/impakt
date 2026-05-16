# Regras de Teste — IMPAKT

## Banco de dados
- Banco de teste: `IMPAKT_test` (NUNCA usar produção)
- Limpar tabelas com `TRUNCATE ... CASCADE` antes de cada suite
- Rodar migrations antes de cada suite via `globalSetup`

## Valores monetários
- SEMPRE em centavos: R$ 1,00 = 100 | R$ 100,00 = 10000
- Split NUNCA pode ter diferença de 1 centavo (soma deve ser exata)
- Plataforma: exatamente 1% — arredondar para baixo se necessário

## Regras de afiliados
- Testar com 1, 2, 3, 4 e 5 níveis sempre
- Quem vende recebe sempre a maior fatia
- Nível mais distante: mínimo garantido de 10% do pool
- Soma dos percentuais por nível == 100% do pool

## Regras de escrow
- Pedido pago → status = "paid" e escrow_release_at = NOW + 7 dias
- Confirmação antecipada → libera antes do prazo
- Prazo vencido → cron libera automaticamente
- Devolução solicitada → NENHUM split executado

## Regras de devolução
- 100% estornado ao comprador
- Todas as commissions → status = "cancelled"
- Carteiras NÃO atualizadas
- Acesso digital revogado imediatamente

## Regras de recorrência
- billing_cycle incrementa a cada renovação
- Afiliado original continua recebendo em cada ciclo
- Cancelamento → sem cobranças futuras, sem estorno retroativo

## Fluxos críticos (testar antes de qualquer deploy)
1. Cadastro → ativação de conta (vendedor e afiliado)
2. Produto → link de afiliado rastreável
3. Compra via link → escrow retido
4. Escrow liberado → split automático correto
5. Devolução → estorno total, zero comissão
6. Recorrência → cobrança mensal com split recorrente
