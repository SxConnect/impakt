/**
 * Interface do Gateway de Pagamento (Port)
 * Define o contrato que todos os gateways devem seguir
 * Permite trocar entre Pagar.me, Stripe, Asaas sem afetar o sistema
 */

export class PaymentGateway {
    /**
     * Nome do provider
     * @returns {string}
     */
    getProviderName() {
        throw new Error('Método getProviderName() deve ser implementado');
    }

    /**
     * Cria um cliente no gateway
     * @param {object} customerData
     * @returns {Promise<{customerId: string, providerResponse: object}>}
     */
    async createCustomer(customerData) {
        throw new Error('Método createCustomer() deve ser implementado');
    }

    /**
     * Processa pagamento com cartão de crédito
     * @param {object} paymentData
     * @returns {Promise<{paymentId: string, status: string, providerResponse: object}>}
     */
    async processCreditCard(paymentData) {
        throw new Error('Método processCreditCard() deve ser implementado');
    }

    /**
     * Gera boleto bancário
     * @param {object} paymentData
     * @returns {Promise<{paymentId: string, boletoUrl: string, boletoBarcode: string, providerResponse: object}>}
     */
    async generateBoleto(paymentData) {
        throw new Error('Método generateBoleto() deve ser implementado');
    }

    /**
     * Gera PIX
     * @param {object} paymentData
     * @returns {Promise<{paymentId: string, pixQrCode: string, pixQrCodeUrl: string, providerResponse: object}>}
     */
    async generatePix(paymentData) {
        throw new Error('Método generatePix() deve ser implementado');
    }

    /**
     * Consulta status do pagamento
     * @param {string} paymentId
     * @returns {Promise<{status: string, providerResponse: object}>}
     */
    async getPaymentStatus(paymentId) {
        throw new Error('Método getPaymentStatus() deve ser implementado');
    }

    /**
     * Reembolsa pagamento
     * @param {string} paymentId
     * @param {number} amountCents
     * @returns {Promise<{refundId: string, status: string, providerResponse: object}>}
     */
    async refundPayment(paymentId, amountCents) {
        throw new Error('Método refundPayment() deve ser implementado');
    }

    /**
     * Cancela pagamento
     * @param {string} paymentId
     * @returns {Promise<{status: string, providerResponse: object}>}
     */
    async cancelPayment(paymentId) {
        throw new Error('Método cancelPayment() deve ser implementado');
    }

    /**
     * Valida webhook
     * @param {object} payload
     * @param {string} signature
     * @returns {Promise<boolean>}
     */
    async validateWebhook(payload, signature) {
        throw new Error('Método validateWebhook() deve ser implementado');
    }

    /**
     * Processa webhook
     * @param {object} payload
     * @returns {Promise<{event: string, paymentId: string, status: string, data: object}>}
     */
    async processWebhook(payload) {
        throw new Error('Método processWebhook() deve ser implementado');
    }
}

export default PaymentGateway;
