import { AppError } from '../../../shared/errors/AppError.js';

/**
 * Caso de Uso: Processar Webhook
 * Processa webhooks dos gateways de pagamento
 */
export class HandleWebhook {
    constructor(
        paymentRepository,
        paymentGatewayFactory,
        confirmPayment
    ) {
        this.paymentRepository = paymentRepository;
        this.paymentGatewayFactory = paymentGatewayFactory;
        this.confirmPayment = confirmPayment;
    }

    async execute(provider, payload, signature) {
        // 1. Cria gateway
        const gateway = this.paymentGatewayFactory.create(provider);

        // 2. Valida webhook
        const isValid = await gateway.validateWebhook(payload, signature);
        if (!isValid) {
            throw new AppError('Webhook inválido', 401);
        }

        // 3. Processa webhook
        const webhookData = await gateway.processWebhook(payload);

        // 4. Busca pagamento
        const payment = await this.paymentRepository.findByProviderPaymentId(
            webhookData.paymentId
        );

        if (!payment) {
            console.warn(`Pagamento não encontrado: ${webhookData.paymentId}`);
            return { processed: false, reason: 'payment_not_found' };
        }

        // 5. Atualiza status do pagamento
        const oldStatus = payment.status;
        payment.status = webhookData.status;
        payment.providerResponse = webhookData.data;
        payment.updatedAt = new Date();

        // Se foi pago, registra data
        if (webhookData.status === 'paid' && !payment.paidAt) {
            payment.markAsPaid();
        }

        // Se foi reembolsado
        if (webhookData.status === 'refunded' && !payment.refundedAt) {
            payment.markAsRefunded('webhook_refund');
        }

        await this.paymentRepository.update(payment);

        // 6. Se mudou para 'paid', confirma o pedido
        if (oldStatus !== 'paid' && webhookData.status === 'paid') {
            try {
                await this.confirmPayment.execute(
                    payment.orderId,
                    payment.providerPaymentId,
                    payment.method
                );
            } catch (error) {
                console.error('Erro ao confirmar pedido:', error);
                // Não falha o webhook se houver erro ao confirmar pedido
            }
        }

        return {
            processed: true,
            event: webhookData.event,
            paymentId: payment.id,
            orderId: payment.orderId,
            oldStatus,
            newStatus: webhookData.status,
        };
    }
}

export default HandleWebhook;
