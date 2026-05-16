import { AppError } from '../../../shared/errors/AppError.js';

/**
 * Caso de Uso: Reembolsar Pagamento
 * Reembolsa um pagamento e cancela comissões
 */
export class RefundPayment {
    constructor(
        paymentRepository,
        orderRepository,
        paymentGatewayFactory,
        cancelCommissions
    ) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.paymentGatewayFactory = paymentGatewayFactory;
        this.cancelCommissions = cancelCommissions;
    }

    async execute(paymentId, reason, userId, userRole) {
        // 1. Busca pagamento
        const payment = await this.paymentRepository.findById(paymentId);
        if (!payment) {
            throw new AppError('Pagamento não encontrado', 404);
        }

        // 2. Busca pedido
        const order = await this.orderRepository.findById(payment.orderId);
        if (!order) {
            throw new AppError('Pedido não encontrado', 404);
        }

        // 3. Verifica permissão
        const canRefund =
            userRole === 'admin' ||
            order.sellerId === userId;

        if (!canRefund) {
            throw new AppError('Você não tem permissão para reembolsar este pagamento', 403);
        }

        // 4. Valida se pode ser reembolsado
        if (!payment.canBeRefunded()) {
            throw new AppError(
                `Pagamento não pode ser reembolsado. Status: ${payment.status}`,
                400
            );
        }

        // 5. Processa reembolso no gateway
        const gateway = this.paymentGatewayFactory.create(payment.provider);

        try {
            const refundResult = await gateway.refundPayment(
                payment.providerPaymentId,
                payment.amountCents
            );

            // 6. Atualiza pagamento
            payment.markAsRefunded(reason);
            payment.providerResponse = {
                ...payment.providerResponse,
                refund: refundResult.providerResponse,
            };

            const updatedPayment = await this.paymentRepository.update(payment);

            // 7. Atualiza pedido
            order.markAsRefunded(reason);
            await this.orderRepository.update(order);

            // 8. Cancela comissões
            try {
                await this.cancelCommissions.execute(order.id, 'refund');
            } catch (error) {
                console.error('Erro ao cancelar comissões:', error);
                // Não falha o reembolso se houver erro nas comissões
            }

            return updatedPayment;
        } catch (error) {
            throw new AppError(`Erro ao processar reembolso: ${error.message}`, 500);
        }
    }
}

export default RefundPayment;
