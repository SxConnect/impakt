// tests/unit/order/Order.test.js
// Testa a entidade Order e suas regras de negócio

import { Order } from '../../../src/modules/order/domain/Order.js';

describe('Order — Entidade de Pedido', () => {

  describe('Criação de pedido', () => {
    test('Cria pedido com dados válidos', () => {
      const order = new Order({
        id: '123',
        orderNumber: 'ORD-123',
        productId: 'prod-1',
        productName: 'Curso Node.js',
        productType: 'digital',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
      });

      expect(order.id).toBe('123');
      expect(order.status).toBe('pending');
      expect(order.totalCents).toBe(10000);
    });

    test('Lança erro se productId não for fornecido', () => {
      expect(() => {
        new Order({
          sellerId: 'seller-1',
          buyerId: 'buyer-1',
          quantity: 1,
          unitPriceCents: 10000,
          totalCents: 10000,
          platformFeeCents: 100,
          affiliateAmountCents: 4000,
          sellerAmountCents: 5900,
        });
      }).toThrow('Product ID é obrigatório');
    });

    test('Lança erro se sellerId não for fornecido', () => {
      expect(() => {
        new Order({
          productId: 'prod-1',
          buyerId: 'buyer-1',
          quantity: 1,
          unitPriceCents: 10000,
          totalCents: 10000,
          platformFeeCents: 100,
          affiliateAmountCents: 4000,
          sellerAmountCents: 5900,
        });
      }).toThrow('Seller ID é obrigatório');
    });

    test('Lança erro se buyerId não for fornecido', () => {
      expect(() => {
        new Order({
          productId: 'prod-1',
          sellerId: 'seller-1',
          quantity: 1,
          unitPriceCents: 10000,
          totalCents: 10000,
          platformFeeCents: 100,
          affiliateAmountCents: 4000,
          sellerAmountCents: 5900,
        });
      }).toThrow('Buyer ID é obrigatório');
    });

    test('Lança erro se quantidade for zero ou negativa', () => {
      expect(() => {
        new Order({
          productId: 'prod-1',
          sellerId: 'seller-1',
          buyerId: 'buyer-1',
          quantity: 0,
          unitPriceCents: 10000,
          totalCents: 10000,
          platformFeeCents: 100,
          affiliateAmountCents: 4000,
          sellerAmountCents: 5900,
        });
      }).toThrow('Quantidade deve ser maior que zero');
    });

    test('Lança erro se status for inválido', () => {
      expect(() => {
        new Order({
          productId: 'prod-1',
          sellerId: 'seller-1',
          buyerId: 'buyer-1',
          quantity: 1,
          unitPriceCents: 10000,
          totalCents: 10000,
          platformFeeCents: 100,
          affiliateAmountCents: 4000,
          sellerAmountCents: 5900,
          status: 'invalid_status',
        });
      }).toThrow('Status inválido');
    });
  });

  describe('Marcar como pago', () => {
    test('Marca pedido pending como paid', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'pending',
      });

      order.markAsPaid('payment-123', 'pix');

      expect(order.status).toBe('paid');
      expect(order.paymentId).toBe('payment-123');
      expect(order.paymentMethod).toBe('pix');
      expect(order.paidAt).toBeInstanceOf(Date);
    });

    test('Lança erro se tentar marcar como pago quando não está pending', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'paid',
      });

      expect(() => {
        order.markAsPaid('payment-123', 'pix');
      }).toThrow('Não é possível marcar como pago');
    });
  });

  describe('Marcar como completo', () => {
    test('Marca pedido paid como completed', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'paid',
      });

      order.markAsCompleted();

      expect(order.status).toBe('completed');
      expect(order.completedAt).toBeInstanceOf(Date);
    });

    test('Lança erro se tentar completar quando não está paid', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'pending',
      });

      expect(() => {
        order.markAsCompleted();
      }).toThrow('Não é possível completar');
    });
  });

  describe('Cancelamento', () => {
    test('Cancela pedido pending', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'pending',
      });

      order.cancel('Comprador desistiu');

      expect(order.status).toBe('cancelled');
      expect(order.cancellationReason).toBe('Comprador desistiu');
      expect(order.cancelledAt).toBeInstanceOf(Date);
    });

    test('Cancela pedido paid', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'paid',
      });

      order.cancel('Produto indisponível');

      expect(order.status).toBe('cancelled');
    });

    test('Lança erro se tentar cancelar pedido completed', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'completed',
      });

      expect(() => {
        order.cancel('Motivo qualquer');
      }).toThrow('Não é possível cancelar pedido já completado');
    });

    test('Lança erro se tentar cancelar pedido já cancelled', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'cancelled',
      });

      expect(() => {
        order.cancel('Motivo qualquer');
      }).toThrow('Pedido já está cancelado');
    });
  });

  describe('Reembolso', () => {
    test('Reembolsa pedido paid', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'paid',
      });

      order.markAsRefunded('Produto com defeito');

      expect(order.status).toBe('refunded');
      expect(order.cancellationReason).toBe('Produto com defeito');
      expect(order.cancelledAt).toBeInstanceOf(Date);
    });

    test('Reembolsa pedido completed', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'completed',
      });

      order.markAsRefunded('Não atendeu expectativas');

      expect(order.status).toBe('refunded');
    });

    test('Lança erro se tentar reembolsar pedido pending', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'pending',
      });

      expect(() => {
        order.markAsRefunded('Motivo qualquer');
      }).toThrow('Não é possível reembolsar');
    });
  });

  describe('Verificações de estado', () => {
    test('canBeCancelled retorna true para pending', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'pending',
      });

      expect(order.canBeCancelled()).toBe(true);
    });

    test('canBeCancelled retorna true para paid', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'paid',
      });

      expect(order.canBeCancelled()).toBe(true);
    });

    test('canBeCancelled retorna false para completed', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'completed',
      });

      expect(order.canBeCancelled()).toBe(false);
    });

    test('canBeRefunded retorna true para paid', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'paid',
      });

      expect(order.canBeRefunded()).toBe(true);
    });

    test('canBeRefunded retorna true para completed', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'completed',
      });

      expect(order.canBeRefunded()).toBe(true);
    });

    test('canBeRefunded retorna false para pending', () => {
      const order = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'pending',
      });

      expect(order.canBeRefunded()).toBe(false);
    });

    test('isPaid retorna true para paid e completed', () => {
      const orderPaid = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'paid',
      });

      const orderCompleted = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'completed',
      });

      expect(orderPaid.isPaid()).toBe(true);
      expect(orderCompleted.isPaid()).toBe(true);
    });

    test('isActive retorna false para cancelled e refunded', () => {
      const orderCancelled = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'cancelled',
      });

      const orderRefunded = new Order({
        productId: 'prod-1',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
        status: 'refunded',
      });

      expect(orderCancelled.isActive()).toBe(false);
      expect(orderRefunded.isActive()).toBe(false);
    });
  });

  describe('Métodos estáticos', () => {
    test('generateOrderNumber gera número único', () => {
      const orderNumber1 = Order.generateOrderNumber();
      const orderNumber2 = Order.generateOrderNumber();

      expect(orderNumber1).toMatch(/^ORD-/);
      expect(orderNumber2).toMatch(/^ORD-/);
      expect(orderNumber1).not.toBe(orderNumber2);
    });

    test('calculateAmounts calcula valores corretamente', () => {
      const amounts = Order.calculateAmounts(
        10000, // R$ 100
        1,     // quantidade
        1,     // 1% plataforma
        40     // 40% afiliados
      );

      expect(amounts.totalCents).toBe(10000);
      expect(amounts.platformFeeCents).toBe(100);
      expect(amounts.affiliateAmountCents).toBe(4000);
      expect(amounts.sellerAmountCents).toBe(5900);
    });

    test('calculateAmounts com quantidade múltipla', () => {
      const amounts = Order.calculateAmounts(
        5000, // R$ 50
        2,    // quantidade
        1,    // 1% plataforma
        30    // 30% afiliados
      );

      expect(amounts.totalCents).toBe(10000); // 50 * 2
      expect(amounts.platformFeeCents).toBe(100);
      expect(amounts.affiliateAmountCents).toBe(3000);
      expect(amounts.sellerAmountCents).toBe(6900);
    });

    test('calculateAmounts soma total é exata', () => {
      const amounts = Order.calculateAmounts(10000, 1, 1, 40);

      const total = amounts.platformFeeCents +
        amounts.affiliateAmountCents +
        amounts.sellerAmountCents;

      expect(total).toBe(amounts.totalCents);
    });
  });

  describe('Serialização', () => {
    test('toJSON retorna objeto completo', () => {
      const order = new Order({
        id: '123',
        orderNumber: 'ORD-123',
        productId: 'prod-1',
        productName: 'Curso Node.js',
        productType: 'digital',
        sellerId: 'seller-1',
        buyerId: 'buyer-1',
        quantity: 1,
        unitPriceCents: 10000,
        totalCents: 10000,
        platformFeeCents: 100,
        affiliateAmountCents: 4000,
        sellerAmountCents: 5900,
      });

      const json = order.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('orderNumber');
      expect(json).toHaveProperty('productId');
      expect(json).toHaveProperty('status');
      expect(json).toHaveProperty('totalCents');
    });
  });
});
