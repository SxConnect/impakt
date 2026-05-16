/**
 * Entidade Payment (Pagamento)
 * Representa um pagamento no sistema
 */

export class Payment {
    constructor({
        id,
        orderId,
        provider, // 'pagarme', 'stripe', 'asaas'
        providerPaymentId = null,
        providerCustomerId = null,
        method, // 'credit_card', 'boleto', 'pix'
        amountCents,
        status = 'pending',
        paidAt = null,
        refundedAt = null,
        refundReason = null,
        installments = 1,
        cardBrand = null,
        cardLastDigits = null,
        boletoUrl = null,
        boletoBarcode = null,
        pixQrCode = null,
        pixQrCodeUrl = null,
        metadata = {},
        providerResponse = {},
        createdAt = new Date(),
        updatedAt = new Date(),
    }) {
        this.id = id;
        this.orderId = orderId;
        this.provider = provider;
        this.providerPaymentId = providerPaymentId;
        this.providerCustomerId = providerCustomerId;
        this.method = method;
        this.amountCents = amountCents;
        this.status = status;
        this.paidAt = paidAt;
        this.refundedAt = refundedAt;
        this.refundReason = refundReason;
        this.installments = installments;
        this.cardBrand = cardBrand;
        this.cardLastDigits = cardLastDigits;
        this.boletoUrl = boletoUrl;
        this.boletoBarcode = boletoBarcode;
        this.pixQrCode = pixQrCode;
        this.pixQrCodeUrl = pixQrCodeUrl;
        this.metadata = metadata;
        this.providerResponse = providerResponse;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;

        this.validate();
    }

    validate() {
        if (!this.orderId) {
            throw new Error('Order ID é obrigatório');
        }

        if (!this.provider) {
            throw new Error('Provider é obrigatório');
        }

        const validProviders = ['pagarme', 'stripe', 'asaas'];
        if (!validProviders.includes(this.provider)) {
            throw new Error(`Provider inválido: ${this.provider}`);
        }

        if (!this.method) {
            throw new Error('Método de pagamento é obrigatório');
        }

        const validMethods = ['credit_card', 'boleto', 'pix', 'debit_card'];
        if (!validMethods.includes(this.method)) {
            throw new Error(`Método inválido: ${this.method}`);
        }

        if (!this.amountCents || this.amountCents < 1) {
            throw new Error('Valor deve ser maior que zero');
        }

        const validStatuses = ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'];
        if (!validStatuses.includes(this.status)) {
            throw new Error(`Status inválido: ${this.status}`);
        }

        if (this.installments < 1 || this.installments > 12) {
            throw new Error('Parcelas devem estar entre 1 e 12');
        }
    }

    /**
     * Marca pagamento como pago
     */
    markAsPaid() {
        if (this.status === 'paid') {
            throw new Error('Pagamento já está pago');
        }

        this.status = 'paid';
        this.paidAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Marca pagamento como falho
     */
    markAsFailed() {
        this.status = 'failed';
        this.updatedAt = new Date();
    }

    /**
     * Marca pagamento como reembolsado
     */
    markAsRefunded(reason) {
        if (this.status !== 'paid') {
            throw new Error('Apenas pagamentos pagos podem ser reembolsados');
        }

        this.status = 'refunded';
        this.refundReason = reason;
        this.refundedAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * Marca pagamento como cancelado
     */
    markAsCancelled() {
        if (this.status === 'paid') {
            throw new Error('Pagamento pago não pode ser cancelado, use reembolso');
        }

        this.status = 'cancelled';
        this.updatedAt = new Date();
    }

    /**
     * Verifica se pagamento está pago
     */
    isPaid() {
        return this.status === 'paid';
    }

    /**
     * Verifica se pode ser reembolsado
     */
    canBeRefunded() {
        return this.status === 'paid';
    }

    /**
     * Converte para objeto simples
     */
    toJSON() {
        return {
            id: this.id,
            orderId: this.orderId,
            provider: this.provider,
            providerPaymentId: this.providerPaymentId,
            providerCustomerId: this.providerCustomerId,
            method: this.method,
            amountCents: this.amountCents,
            status: this.status,
            paidAt: this.paidAt,
            refundedAt: this.refundedAt,
            refundReason: this.refundReason,
            installments: this.installments,
            cardBrand: this.cardBrand,
            cardLastDigits: this.cardLastDigits,
            boletoUrl: this.boletoUrl,
            boletoBarcode: this.boletoBarcode,
            pixQrCode: this.pixQrCode,
            pixQrCodeUrl: this.pixQrCodeUrl,
            metadata: this.metadata,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}

export default Payment;
