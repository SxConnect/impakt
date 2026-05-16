/**
 * Interface do Repositório de Pagamentos
 * Define o contrato que as implementações devem seguir
 */

export class PaymentRepository {
    /**
     * Cria um novo pagamento
     * @param {Payment} payment
     * @returns {Promise<Payment>}
     */
    async create(payment) {
        throw new Error('Método create() deve ser implementado');
    }

    /**
     * Busca pagamento por ID
     * @param {string} id
     * @returns {Promise<Payment|null>}
     */
    async findById(id) {
        throw new Error('Método findById() deve ser implementado');
    }

    /**
     * Busca pagamento por ID do pedido
     * @param {string} orderId
     * @returns {Promise<Payment|null>}
     */
    async findByOrderId(orderId) {
        throw new Error('Método findByOrderId() deve ser implementado');
    }

    /**
     * Busca pagamento por ID do provider
     * @param {string} providerPaymentId
     * @returns {Promise<Payment|null>}
     */
    async findByProviderPaymentId(providerPaymentId) {
        throw new Error('Método findByProviderPaymentId() deve ser implementado');
    }

    /**
     * Atualiza pagamento
     * @param {Payment} payment
     * @returns {Promise<Payment>}
     */
    async update(payment) {
        throw new Error('Método update() deve ser implementado');
    }

    /**
     * Lista pagamentos com filtros
     * @param {object} filters
     * @param {number} page
     * @param {number} limit
     * @returns {Promise<{payments: Payment[], total: number}>}
     */
    async findAll(filters = {}, page = 1, limit = 20) {
        throw new Error('Método findAll() deve ser implementado');
    }
}

export default PaymentRepository;
