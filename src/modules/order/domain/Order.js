/**
 * Entidade Order (Pedido)
 * Representa um pedido no sistema
 */

export class Order {
    constructor({
        id,
        orderNumber,
        productId,
        productName,
        productType,
        sellerId,
        buyerId,
        affiliateLinkCode = null,
        quantity = 1,
        unitPriceCents,
        totalCents,
        platformFeeCents,
        affiliateAmountCents,
        sellerAmountCents,
        status = 'pending',
        paymentMethod = null,
        paymentId = null,
        paidAt = null,
        completedAt = null,
        cancelledAt = null,
        cancellationReason = null,
        metadata = {},
        createdAt = new Date(),
        updatedAt = new Date(),
    }) {
        this.id = id;
        this.orderNumber = orderNumber;
        this.productId = productId;
        this.productName = productName;
        this.productType = productType;
        this.sellerId = sellerId;
        this.buyerId = buyerId;
        this.affiliateLinkCode = affiliateLinkCode;
        this.quantity = quantity;
        this.unitPriceCents = unitPriceCents;
        this.totalCents = totalCents;
        this.platformFeeCents = platformFeeCents;
        this.affiliateAmountCents = affiliateAmountCents;
        this.sellerAmountCents = sellerAmountCents;
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.paymentId = paymentId;
        this.paidAt = paidAt;
        this.completedAt = completedAt;
        this.cancelledAt = cancelledAt;
        this.cancellationReason = cancellationReason;
        this.metadata = metadata;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;

        this.validate();
    }

    validate() {
        if (!this.productId) {
            throw new Error('Product ID é obrigatório');
        }

        if (!this.sellerId) {
            throw new Error('Seller ID é obrigatório');
        }

        if (!this.buyerId) {
            throw new Error('Buyer ID é obrigatório');
        }

        if (!this.quantity || this.quantity < 1) {
            throw new Error('Quantidade deve ser maior que zero');
        }

        if (!this.unitPriceCents || this.unitPriceCents < 1) {
            throw new Error('Preço unitário deve ser maior que zero');
        }

        if (!this.totalCents || this.totalCents < 1) {
            throw new Error('Total deve ser maior que zero');
        }

        const validStatuses = ['pending', 'paid', 'completed', 'cancelled', 'refunded'];
        if (!validStatuses.includes(this.status)) {
            throw new Error(`Status inválido: ${this.status}`);
        }

        const validProductTypes = ['physical', 'digital', 'service', 'subscription'];
        if (this.productType && !validProductTypes.includes(this.productType)) {
            throw new Error(`Tipo de produto inválido: ${this.productType}`);
        }
    }

    /**
     * Marca pedido como pago
     */
    markAsPaid(paymentId, paymentMethod) {
        if (this.status !== 'pending') {
            throw new Error(`Não é possível marcar como pago. Status atual: ${this.status}`);
        }

        this.status = 'paid';
        this.paymentId = paymentId;
        this.paymentMethod = paymentMethod;
        this.paidAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Marca pedido como completo
     */
    markAsCompleted() {
        if (this.status !== 'paid') {
            throw new Error(`Não é possível completar. Status atual: ${this.status}`);
        }

        this.status = 'completed';
        this.completedAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Cancela o pedido
     */
    cancel(reason) {
        if (this.status === 'completed') {
            throw new Error('Não é possível cancelar pedido já completado');
        }

        if (this.status === 'cancelled') {
            throw new Error('Pedido já está cancelado');
        }

        this.status = 'cancelled';
        this.cancellationReason = reason;
        this.cancelledAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Marca pedido como reembolsado
     */
    markAsRefunded(reason) {
        if (this.status !== 'paid' && this.status !== 'completed') {
            throw new Error(`Não é possível reembolsar. Status atual: ${this.status}`);
        }

        this.status = 'refunded';
        this.cancellationReason = reason;
        this.cancelledAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Verifica se pedido pode ser cancelado
     */
    canBeCancelled() {
        return this.status === 'pending' || this.status === 'paid';
    }

    /**
     * Verifica se pedido pode ser reembolsado
     */
    canBeRefunded() {
        return this.status === 'paid' || this.status === 'completed';
    }

    /**
     * Verifica se pedido está pago
     */
    isPaid() {
        return ['paid', 'completed'].includes(this.status);
    }

    /**
     * Verifica se pedido está ativo
     */
    isActive() {
        return !['cancelled', 'refunded'].includes(this.status);
    }

    /**
     * Gera número do pedido
     */
    static generateOrderNumber() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `ORD-${timestamp}-${random}`;
    }

    /**
     * Calcula valores do pedido
     */
    static calculateAmounts(unitPriceCents, quantity, platformFeePct, affiliatePct) {
        const totalCents = unitPriceCents * quantity;
        const platformFeeCents = Math.round(totalCents * (platformFeePct / 100));
        const affiliateAmountCents = Math.round(totalCents * (affiliatePct / 100));
        const sellerAmountCents = totalCents - platformFeeCents - affiliateAmountCents;

        return {
            totalCents,
            platformFeeCents,
            affiliateAmountCents,
            sellerAmountCents,
        };
    }

    /**
     * Converte para objeto simples
     */
    toJSON() {
        return {
            id: this.id,
            orderNumber: this.orderNumber,
            productId: this.productId,
            productName: this.productName,
            productType: this.productType,
            sellerId: this.sellerId,
            buyerId: this.buyerId,
            affiliateLinkCode: this.affiliateLinkCode,
            quantity: this.quantity,
            unitPriceCents: this.unitPriceCents,
            totalCents: this.totalCents,
            platformFeeCents: this.platformFeeCents,
            affiliateAmountCents: this.affiliateAmountCents,
            sellerAmountCents: this.sellerAmountCents,
            status: this.status,
            paymentMethod: this.paymentMethod,
            paymentId: this.paymentId,
            paidAt: this.paidAt,
            completedAt: this.completedAt,
            cancelledAt: this.cancelledAt,
            cancellationReason: this.cancellationReason,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

export default Order;
