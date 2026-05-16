/**
 * Caso de Uso: Obter Estatísticas de Pedidos
 * Retorna estatísticas de vendas ou compras do usuário
 */
export class GetOrderStats {
    constructor(orderRepository) {
        this.orderRepository = orderRepository;
    }

    async execute(userId, type = 'seller') {
        if (type === 'seller') {
            return await this.orderRepository.getSellerStats(userId);
        }

        if (type === 'buyer') {
            return await this.orderRepository.getBuyerStats(userId);
        }

        throw new Error('Tipo inválido. Use "seller" ou "buyer"');
    }
}

export default GetOrderStats;
