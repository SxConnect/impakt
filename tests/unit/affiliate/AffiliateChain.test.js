// tests/unit/affiliate/AffiliateLink.test.js
// Testa a entidade AffiliateLink e suas funcionalidades

import { AffiliateLink } from '../../../src/modules/affiliate/domain/AffiliateLink.js';

describe('AffiliateLink — Link de Afiliado', () => {

  describe('Construção da entidade', () => {
    test('Cria link com dados mínimos', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
      });

      expect(link.id).toBe('123');
      expect(link.productId).toBe('prod-1');
      expect(link.affiliateId).toBe('aff-1');
      expect(link.code).toBe('ABC123');
      expect(link.clicks).toBe(0);
      expect(link.conversions).toBe(0);
    });

    test('Cria link com cliques e conversões', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
        clicks: 100,
        conversions: 10,
      });

      expect(link.clicks).toBe(100);
      expect(link.conversions).toBe(10);
    });
  });

  describe('Geração de URL completa', () => {
    test('URL gerada inclui o código de rastreamento', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'curso-node',
        affiliateId: 'aff-1',
        code: 'ABC123',
      });

      const url = link.getFullUrl('https://impakt.com');
      expect(url).toBe('https://impakt.com/p/curso-node?ref=ABC123');
    });

    test('URL funciona com diferentes bases', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-123',
        affiliateId: 'aff-1',
        code: 'XYZ789',
      });

      expect(link.getFullUrl('http://localhost:3000'))
        .toBe('http://localhost:3000/p/prod-123?ref=XYZ789');

      expect(link.getFullUrl('https://app.impakt.com.br'))
        .toBe('https://app.impakt.com.br/p/prod-123?ref=XYZ789');
    });
  });

  describe('Taxa de conversão', () => {
    test('Taxa de conversão com 0 cliques é 0%', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
        clicks: 0,
        conversions: 0,
      });

      expect(link.getConversionRate()).toBe('0.00');
    });

    test('Taxa de conversão é calculada corretamente', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
        clicks: 100,
        conversions: 10,
      });

      expect(link.getConversionRate()).toBe('10.00');
    });

    test('Taxa de conversão com valores decimais', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
        clicks: 137,
        conversions: 8,
      });

      expect(link.getConversionRate()).toBe('5.84');
    });

    test('Taxa de conversão é formatada com 2 casas decimais', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
        clicks: 3,
        conversions: 1,
      });

      expect(link.getConversionRate()).toBe('33.33');
    });
  });

  describe('Performance do link', () => {
    test('Link com conversão > 5% tem boa performance', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
        clicks: 100,
        conversions: 10, // 10%
      });

      expect(link.hasGoodPerformance()).toBe(true);
    });

    test('Link com conversão = 5% NÃO tem boa performance', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
        clicks: 100,
        conversions: 5, // 5%
      });

      expect(link.hasGoodPerformance()).toBe(false);
    });

    test('Link com conversão < 5% NÃO tem boa performance', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
        clicks: 100,
        conversions: 3, // 3%
      });

      expect(link.hasGoodPerformance()).toBe(false);
    });

    test('Link sem cliques NÃO tem boa performance', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
        clicks: 0,
        conversions: 0,
      });

      expect(link.hasGoodPerformance()).toBe(false);
    });
  });

  describe('Incremento de contadores', () => {
    test('Incrementa cliques corretamente', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
        clicks: 10,
      });

      link.incrementClicks();
      expect(link.clicks).toBe(11);

      link.incrementClicks();
      expect(link.clicks).toBe(12);
    });

    test('Incrementa conversões corretamente', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
        conversions: 5,
      });

      link.incrementConversions();
      expect(link.conversions).toBe(6);

      link.incrementConversions();
      expect(link.conversions).toBe(7);
    });
  });

  describe('Serialização', () => {
    test('toPublic() retorna apenas dados públicos', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
        clicks: 100,
        conversions: 10,
        createdAt: new Date('2025-01-01'),
      });

      const publicData = link.toPublic();

      expect(publicData).toHaveProperty('id');
      expect(publicData).toHaveProperty('code');
      expect(publicData).toHaveProperty('clicks');
      expect(publicData).toHaveProperty('conversions');
      expect(publicData).toHaveProperty('conversionRate');
      expect(publicData).toHaveProperty('createdAt');

      // Não deve expor IDs internos
      expect(publicData).not.toHaveProperty('productId');
      expect(publicData).not.toHaveProperty('affiliateId');
    });

    test('toJSON() retorna dados completos', () => {
      const link = new AffiliateLink({
        id: '123',
        productId: 'prod-1',
        affiliateId: 'aff-1',
        code: 'ABC123',
        clicks: 100,
        conversions: 10,
        createdAt: new Date('2025-01-01'),
      });

      const json = link.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('productId');
      expect(json).toHaveProperty('affiliateId');
      expect(json).toHaveProperty('code');
      expect(json).toHaveProperty('clicks');
      expect(json).toHaveProperty('conversions');
      expect(json).toHaveProperty('conversionRate');
      expect(json).toHaveProperty('createdAt');
    });
  });
});
