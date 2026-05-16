import { AppError } from '../../../shared/errors/AppError.js';

/**
 * Caso de Uso: Obter Pedido
 * Busca detalhes de um pedido específico
 */
export class GetOrder {
    constructor(orderRepository, userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    async execute(orderId, userId, userRole) {
        // Busca pedido
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new AppError('Pedido não encontrado', 404);
        }

        // Verifica permissão
        const canView =
            userRole === 'admin' ||
            order.buyerId === userId ||
            order.sellerId === userId;

        if (!canView) {
            throw new AppError('Você não tem permissão para ver este pedido', 403);
        }

        return order;
    }
}

export default GetOrder;
