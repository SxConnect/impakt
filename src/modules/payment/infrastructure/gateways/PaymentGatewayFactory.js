import { PagarmeGateway } from './PagarmeGateway.js';
import { StripeGateway } from './StripeGateway.js';
import { AsaasGateway } from './AsaasGateway.js';

/**
 * Factory para criar instâncias de Payment Gateway
 * Permite trocar facilmente entre Pagar.me, Stripe e Asaas
 */
export class PaymentGatewayFactory {
    /**
     * Cria uma instância do gateway apropriado
     * @param {string} provider - 'pagarme', 'stripe' ou 'asaas'
     * @param {object} config - Configurações do gateway
     * @returns {PaymentGateway}
     */
    static create(provider, config = {}) {
        switch (provider.toLowerCase()) {
            case 'pagarme':
                return new PagarmeGateway({
                    apiKey: config.pagarmeApiKey || process.env.PAGARME_API_KEY,
                    apiUrl: config.pagarmeApiUrl || process.env.PAGARME_API_URL,
                    webhookSecret: config.pagarmeWebhookSecret || process.env.PAGARME_WEBHOOK_SECRET,
                });

            case 'stripe':
                return new StripeGateway({
                    apiKey: config.stripeApiKey || process.env.STRIPE_API_KEY,
                    apiUrl: config.stripeApiUrl || process.env.STRIPE_API_URL,
                    webhookSecret: config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET,
                });

            case 'asaas':
                return new AsaasGateway({
                    apiKey: config.asaasApiKey || process.env.ASAAS_API_KEY,
                    apiUrl: config.asaasApiUrl || process.env.ASAAS_API_URL,
                    webhookSecret: config.asaasWebhookSecret || process.env.ASAAS_WEBHOOK_SECRET,
                });

            default:
                throw new Error(`Gateway de pagamento não suportado: ${provider}`);
        }
    }

    /**
     * Retorna o gateway padrão configurado
     * @returns {PaymentGateway}
     */
    static createDefault() {
        const defaultProvider = process.env.PAYMENT_PROVIDER || 'pagarme';
        return this.create(defaultProvider);
    }

    /**
     * Lista todos os providers disponíveis
     * @returns {string[]}
     */
    static getAvailableProviders() {
        return ['pagarme', 'stripe', 'asaas'];
    }

    /**
     * Verifica se um provider é suportado
     * @param {string} provider
     * @returns {boolean}
     */
    static isSupported(provider) {
        return this.getAvailableProviders().includes(provider.toLowerCase());
    }
}

export default PaymentGatewayFactory;
