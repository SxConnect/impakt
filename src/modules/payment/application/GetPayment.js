import { AppError } from '../../../shared/errors/AppError.js';

/**
 * Caso de Uso: Obter Pagamento
 * Busca detalhes de um pagamento
 */
export class GetPayment {
    constructor(paymentRepository, orderRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
    }

    async execute(paymentId, userId, userRole) {
        // Busca pagamento
        const payment = await this.paymentRepository.findById(paymentId);
        if (!payment) {
            throw new AppError('Pagamento não encontrado', 404);
        }

        // Busca pedido para verificar permissão
        const order = await this.orderRepository.findById(payment.orderId);
        if (!order) {
            throw new AppError('Pedido não encontrado', 404);
        }

        // Verifica permissão
        const canView =
            userRole === 'admin' ||
            order.buyerId === userId ||
            order.sellerId === userId;

        if (!canView) {
            throw new AppError('Você não tem permissão para ver este pagamento', 403);
        }

        return payment;
    }
}

export default GetPayment;
