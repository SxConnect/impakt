import { AppError } from '../../../shared/errors/AppError.js';

/**
 * Caso de Uso: Cancelar Pedido
 * Cancela um pedido e suas comissões
 */
export class CancelOrder {
    constructor(orderRepository, cancelCommissions) {
        this.orderRepository = orderRepository;
        this.cancelCommissions = cancelCommissions;
    }

    async execute(orderId, userId, userRole, reason) {
        // Busca pedido
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new AppError('Pedido não encontrado', 404);
        }

        // Verifica permissão
        const canCancel =
            userRole === 'admin' ||
            order.buyerId === userId ||
            order.sellerId === userId;

        if (!canCancel) {
            throw new AppError('Você não tem permissão para cancelar este pedido', 403);
        }

        // Valida se pode ser cancelado
        if (!order.canBeCancelled()) {
            throw new AppError(
                `Não é possível cancelar pedido com status: ${order.status}`,
                400
            );
        }

        // Cancela pedido
        order.cancel(reason);
        const updatedOrder = await this.orderRepository.update(order);

        // Cancela comissões
        try {
            await this.cancelCommissions.execute(orderId, 'order_cancelled');
        } catch (error) {
            console.error('Erro ao cancelar comissões:', error);
            // Não falha o cancelamento se houver erro nas comissões
        }

        return updatedOrder;
    }
}

export default CancelOrder;
