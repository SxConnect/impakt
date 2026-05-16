/**
 * Interface do Repositório de Pedidos
 * Define o contrato que as implementações devem seguir
 */

export class OrderRepository {
    /**
     * Cria um novo pedido
     * @param {Order} order
     * @returns {Promise<Order>}
     */
    async create(order) {
        throw new Error('Método create() deve ser implementado');
    }

    /**
     * Busca pedido por ID
     * @param {string} id
     * @returns {Promise<Order|null>}
     */
    async findById(id) {
        throw new Error('Método findById() deve ser implementado');
    }

    /**
     * Busca pedido por número
     * @param {string} orderNumber
     * @returns {Promise<Order|null>}
     */
    async findByOrderNumber(orderNumber) {
        throw new Error('Método findByOrderNumber() deve ser implementado');
    }

    /**
     * Lista pedidos do comprador
     * @param {string} buyerId
     * @param {object} filters
     * @param {number} page
     * @param {number} limit
     * @returns {Promise<{orders: Order[], total: number}>}
     */
    async findByBuyer(buyerId, filters = {}, page = 1, limit = 20) {
        throw new Error('Método findByBuyer() deve ser implementado');
    }

    /**
     * Lista pedidos do vendedor
     * @param {string} sellerId
     * @param {object} filters
     * @param {number} page
     * @param {number} limit
     * @returns {Promise<{orders: Order[], total: number}>}
     */
    async findBySeller(sellerId, filters = {}, page = 1, limit = 20) {
        throw new Error('Método findBySeller() deve ser implementado');
    }

    /**
     * Lista pedidos do produto
     * @param {string} productId
     * @param {number} page
     * @param {number} limit
     * @returns {Promise<{orders: Order[], total: number}>}
     */
    async findByProduct(productId, page = 1, limit = 20) {
        throw new Error('Método findByProduct() deve ser implementado');
    }

    /**
     * Atualiza pedido
     * @param {Order} order
     * @returns {Promise<Order>}
     */
    async update(order) {
        throw new Error('Método update() deve ser implementado');
    }

    /**
     * Atualiza status do pedido
     * @param {string} id
     * @param {string} status
     * @returns {Promise<Order>}
     */
    async updateStatus(id, status) {
        throw new Error('Método updateStatus() deve ser implementado');
    }

    /**
     * Obtém estatísticas do vendedor
     * @param {string} sellerId
     * @returns {Promise<object>}
     */
    async getSellerStats(sellerId) {
        throw new Error('Método getSellerStats() deve ser implementado');
    }

    /**
     * Obtém estatísticas do comprador
     * @param {string} buyerId
     * @returns {Promise<object>}
     */
    async getBuyerStats(buyerId) {
        throw new Error('Método getBuyerStats() deve ser implementado');
    }

    /**
     * Obtém vendas por período
     * @param {string} sellerId
     * @param {string} startDate
     * @param {string} endDate
     * @returns {Promise<Array>}
     */
    async getSalesByPeriod(sellerId, startDate, endDate) {
        throw new Error('Método getSalesByPeriod() deve ser implementado');
    }
}

export default OrderRepository;
