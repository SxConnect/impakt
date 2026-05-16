// tests/unit/commission/CommissionCalculator.test.js
// Testa a lógica pura de cálculo de comissões

import { CommissionCalculator } from '../../../src/modules/commission/domain/CommissionCalculator.js';

describe('CommissionCalculator — Cálculo de Comissões', () => {

  describe('Cálculo básico de comissões', () => {
    test('Venda direta (1 nível): vendedor recebe 100% do pool', () => {
      const result = CommissionCalculator.calculate({
        totalAmountCents: 4000, // R$ 40 (pool de afiliados)
        affiliateChain: [
          { id: 'aff-1', level: 1 }
        ],
        levelCommission: [
          { level: 1, pct: 100 }
        ],
        sellerLevel: 1
      });

      expect(result).toHaveLength(1);
      expect(result[0].affiliateId).toBe('aff-1');
      expect(result[0].level).toBe(1);
      expect(result[0].pct).toBe(100);
      expect(result[0].amountCents).toBe(4000);
    });

    test('2 níveis - N1 vende: N1 recebe mais que N2', () => {
      const result = CommissionCalculator.calculate({
        totalAmountCents: 4000,
        affiliateChain: [
          { id: 'aff-1', level: 1 },
          { id: 'aff-2', level: 2 }
        ],
        levelCommission: [
          { level: 1, pct: 60 }, // Quem vende
          { level: 2, pct: 40 }
        ],
        sellerLevel: 1 // N1 vendeu
      });

      expect(result).toHaveLength(2);

      const n1 = result.find(r => r.level === 1);
      const n2 = result.find(r => r.level === 2);

      expect(n1.pct).toBe(60);
      expect(n2.pct).toBe(40);
      expect(n1.amountCents).toBeGreaterThan(n2.amountCents);
    });

    test('2 níveis - N2 vende: N2 recebe mais que N1', () => {
      const result = CommissionCalculator.calculate({
        totalAmountCents: 4000,
        affiliateChain: [
          { id: 'aff-1', level: 1 },
          { id: 'aff-2', level: 2 }
        ],
        levelCommission: [
          { level: 1, pct: 40 },
          { level: 2, pct: 60 } // Quem vende
        ],
        sellerLevel: 2 // N2 vendeu
      });

      expect(result).toHaveLength(2);

      const n1 = result.find(r => r.level === 1);
      const n2 = result.find(r => r.level === 2);

      expect(n2.pct).toBe(60);
      expect(n1.pct).toBe(40);
      expect(n2.amountCents).toBeGreaterThan(n1.amountCents);
    });

    test('3 níveis - N2 vende: N2 recebe a maior fatia', () => {
      const result = CommissionCalculator.calculate({
        totalAmountCents: 4000,
        affiliateChain: [
          { id: 'aff-1', level: 1 },
          { id: 'aff-2', level: 2 },
          { id: 'aff-3', level: 3 }
        ],
        levelCommission: [
          { level: 1, pct: 20 },
          { level: 2, pct: 50 }, // Quem vende
          { level: 3, pct: 30 }
        ],
        sellerLevel: 2
      });

      expect(result).toHaveLength(3);

      const vendedor = result.find(r => r.level === 2);
      const outros = result.filter(r => r.level !== 2);

      expect(vendedor.pct).toBe(50);
      outros.forEach(outro => {
        expect(vendedor.amountCents).toBeGreaterThan(outro.amountCents);
      });
    });
  });

  describe('Soma das comissões', () => {
    test('Soma dos percentuais é 100%', () => {
      const result = CommissionCalculator.calculate({
        totalAmountCents: 4000,
        affiliateChain: [
          { id: 'aff-1', level: 1 },
          { id: 'aff-2', level: 2 },
          { id: 'aff-3', level: 3 }
        ],
        levelCommission: [
          { level: 1, pct: 30 },
          { level: 2, pct: 50 },
          { level: 3, pct: 20 }
        ],
        sellerLevel: 2
      });

      const totalPct = result.reduce((sum, r) => sum + r.pct, 0);
      expect(totalPct).toBe(100);
    });

    test('Soma dos centavos não perde dinheiro', () => {
      const totalAmountCents = 4000;

      const result = CommissionCalculator.calculate({
        totalAmountCents,
        affiliateChain: [
          { id: 'aff-1', level: 1 },
          { id: 'aff-2', level: 2 }
        ],
        levelCommission: [
          { level: 1, pct: 60 },
          { level: 2, pct: 40 }
        ],
        sellerLevel: 1
      });

      const totalCents = result.reduce((sum, r) => sum + r.amountCents, 0);

      // Permite diferença de até 1 centavo por arredondamento
      expect(Math.abs(totalCents - totalAmountCents)).toBeLessThanOrEqual(result.length);
    });
  });

  describe('Validação de totais', () => {
    test('validateTotal retorna true quando soma está correta', () => {
      const commissions = [
        { amountCents: 2400 },
        { amountCents: 1600 }
      ];

      const isValid = CommissionCalculator.validateTotal(commissions, 4000);
      expect(isValid).toBe(true);
    });

    test('validateTotal aceita diferença de 1 centavo por arredondamento', () => {
      const commissions = [
        { amountCents: 2401 },
        { amountCents: 1600 }
      ];

      const isValid = CommissionCalculator.validateTotal(commissions, 4000);
      expect(isValid).toBe(true);
    });

    test('validateTotal retorna false quando diferença é grande', () => {
      const commissions = [
        { amountCents: 2000 },
        { amountCents: 1000 }
      ];

      const isValid = CommissionCalculator.validateTotal(commissions, 4000);
      expect(isValid).toBe(false);
    });
  });

  describe('Ajuste de arredondamento', () => {
    test('adjustRounding corrige diferença adicionando à maior comissão', () => {
      const commissions = [
        { amountCents: 2400 },
        { amountCents: 1590 }
      ];

      const adjusted = CommissionCalculator.adjustRounding(commissions, 4000);

      const total = adjusted.reduce((sum, c) => sum + c.amountCents, 0);
      expect(total).toBe(4000);

      // A maior comissão deve ter sido ajustada
      expect(adjusted[0].amountCents).toBe(2410);
    });

    test('adjustRounding corrige diferença removendo da maior comissão', () => {
      const commissions = [
        { amountCents: 2410 },
        { amountCents: 1600 }
      ];

      const adjusted = CommissionCalculator.adjustRounding(commissions, 4000);

      const total = adjusted.reduce((sum, c) => sum + c.amountCents, 0);
      expect(total).toBe(4000);

      expect(adjusted[0].amountCents).toBe(2400);
    });
  });

  describe('Cálculo de valor do vendedor', () => {
    test('Calcula valor restante para o vendedor', () => {
      const sellerAmount = CommissionCalculator.calculateSellerAmount({
        totalPriceCents: 10000, // R$ 100
        platformFeeCents: 100,  // R$ 1 (1%)
        affiliateAmountCents: 4000, // R$ 40 (40%)
      });

      expect(sellerAmount).toBe(5900); // R$ 59
    });

    test('Calcula com distribuição de renda', () => {
      const sellerAmount = CommissionCalculator.calculateSellerAmount({
        totalPriceCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        incomeDistAmountCents: 1000, // R$ 10 para beneficiários
      });

      expect(sellerAmount).toBe(4900); // R$ 49
    });

    test('Soma total fecha em 100%', () => {
      const totalPriceCents = 10000;
      const platformFeeCents = 100;
      const affiliateAmountCents = 4000;
      const incomeDistAmountCents = 1000;

      const sellerAmount = CommissionCalculator.calculateSellerAmount({
        totalPriceCents,
        platformFeeCents,
        affiliateAmountCents,
        incomeDistAmountCents,
      });

      const total = platformFeeCents + affiliateAmountCents + incomeDistAmountCents + sellerAmount;
      expect(total).toBe(totalPriceCents);
    });
  });

  describe('Distribuição de renda', () => {
    test('Distribui renda entre beneficiários', () => {
      const result = CommissionCalculator.calculateIncomeDistribution({
        totalAmountCents: 1000, // R$ 10
        incomeDistConfig: [
          { userId: 'user-1', pct: 60 },
          { userId: 'user-2', pct: 40 }
        ]
      });

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].pct).toBe(60);
      expect(result[0].amountCents).toBe(600);

      expect(result[1].userId).toBe('user-2');
      expect(result[1].pct).toBe(40);
      expect(result[1].amountCents).toBe(400);
    });

    test('Retorna array vazio se não há configuração', () => {
      const result = CommissionCalculator.calculateIncomeDistribution({
        totalAmountCents: 1000,
        incomeDistConfig: []
      });

      expect(result).toHaveLength(0);
    });

    test('Retorna array vazio se configuração é null', () => {
      const result = CommissionCalculator.calculateIncomeDistribution({
        totalAmountCents: 1000,
        incomeDistConfig: null
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('Casos extremos', () => {
    test('Cadeia vazia retorna array vazio', () => {
      const result = CommissionCalculator.calculate({
        totalAmountCents: 4000,
        affiliateChain: [],
        levelCommission: [],
        sellerLevel: 1
      });

      expect(result).toHaveLength(0);
    });

    test('Cadeia null retorna array vazio', () => {
      const result = CommissionCalculator.calculate({
        totalAmountCents: 4000,
        affiliateChain: null,
        levelCommission: [],
        sellerLevel: 1
      });

      expect(result).toHaveLength(0);
    });

    test('Lança erro se configuração do vendedor não existe', () => {
      expect(() => {
        CommissionCalculator.calculate({
          totalAmountCents: 4000,
          affiliateChain: [
            { id: 'aff-1', level: 1 }
          ],
          levelCommission: [
            { level: 2, pct: 100 } // Configuração errada
          ],
          sellerLevel: 1 // Vendedor é nível 1, mas config é nível 2
        });
      }).toThrow();
    });
  });
});
