import { AppError } from '../../../shared/errors/AppError.js';

/**
 * Caso de Uso: Confirmar Pagamento
 * Marca pedido como pago e atualiza comissões para 'held'
 */
export class ConfirmPayment {
    constructor(orderRepository, commissionRepository) {
        this.orderRepository = orderRepository;
        this.commissionRepository = commissionRepository;
    }

    async execute(orderId, paymentId, paymentMethod) {
        // Busca pedido
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new AppError('Pedido não encontrado', 404);
        }

        // Valida status
        if (order.status !== 'pending') {
            throw new AppError(
                `Não é possível confirmar pagamento. Status atual: ${order.status}`,
                400
            );
        }

        // Marca como pago
        order.markAsPaid(paymentId, paymentMethod);
        const updatedOrder = await this.orderRepository.update(order);

        // Atualiza comissões para 'held' (em escrow)
        try {
            const commissions = await this.commissionRepository.findByOrderId(orderId);

            for (const commission of commissions) {
                if (commission.status === 'pending') {
                    await this.commissionRepository.updateStatus(commission.id, 'held');
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar comissões:', error);
            // Não falha a confirmação se houver erro nas comissões
        }

        return updatedOrder;
    }
}

export default ConfirmPayment;
