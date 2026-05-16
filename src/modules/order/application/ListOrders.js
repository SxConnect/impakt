import { AppError } from '../../../shared/errors/AppError.js';

/**
 * Caso de Uso: Listar Pedidos
 * Lista pedidos do usuário (comprador ou vendedor)
 */
export class ListOrders {
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }

    async execute(userId, userRole, type = 'buyer', filters = {}, page = 1, limit = 20) {
        // Admin pode ver todos
        if (userRole === 'admin' && filters.sellerId) {
            return await this.orderRepository.findBySeller(
                filters.sellerId,
                filters,
                page,
                limit
            );
        }

        if (userRole === 'admin' && filters.buyerId) {
            return await this.orderRepository.findByBuyer(
                filters.buyerId,
                filters,
                page,
                limit
            );
        }

        // Usuário normal vê apenas seus pedidos
        if (type === 'buyer') {
            return await this.orderRepository.findByBuyer(userId, filters, page, limit);
        }

        if (type === 'seller') {
            return await this.orderRepository.findBySeller(userId, filters, page, limit);
        }

        throw new AppError('Tipo de listagem inválido', 400);
    }
}

export default ListOrders;
