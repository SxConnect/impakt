/**
 * Interface (porta) do repositório de comissões
 */
export class CommissionRepository {
    /**
     * Cria múltiplas comissões (batch)
     * @param {Array} commissionsData - Array de dados de comissões
     * @returns {Promise<Array<Commission>>}
     */
    async createBatch(commissionsData) {
        throw new Error('Método createBatch() não implementado');
    }

    /**
     * Busca comissão por ID
     * @param {string} id - UUID da comissão
     * @returns {Promise<Commission|null>}
     */
    async findById(id) {
        throw new Error('Método findById() não implementado');
    }

    /**
     * Lista comissões de um afiliado
     * @param {string} affiliateId - UUID do afiliado
     * @param {Object} filters - Filtros (status, etc)
     * @param {number} page - Página atual
     * @param {number} limit - Itens por página
     * @returns {Promise<{commissions: Commission[], total: number}>}
     */
    async listByAffiliate(affiliateId, filters, page, limit) {
        throw new Error('Método listByAffiliate() não implementado');
    }

    /**
     * Lista comissões de um pedido
     * @param {string} orderId - UUID do pedido
     * @returns {Promise<Array<Commission>>}
     */
    async listByOrder(orderId) {
        throw new Error('Método listByOrder() não implementado');
    }

    /**
     * Atualiza status de comissões de um pedido
     * @param {string} orderId - UUID do pedido
     * @param {string} newStatus - Novo status
     * @returns {Promise<void>}
     */
    async updateStatusByOrder(orderId, newStatus) {
        throw new Error('Método updateStatusByOrder() não implementado');
    }

    /**
     * Libera comissões (held -> released)
     * @param {string} orderId - UUID do pedido
     * @returns {Promise<Array<Commission>>}
     */
    async releaseByOrder(orderId) {
        throw new Error('Método releaseByOrder() não implementado');
    }

    /**
     * Cancela comissões
     * @param {string} orderId - UUID do pedido
     * @returns {Promise<void>}
     */
    async cancelByOrder(orderId) {
        throw new Error('Método cancelByOrder() não implementado');
    }

    /**
     * Obtém resumo de comissões do afiliado
     * @param {string} affiliateId - UUID do afiliado
     * @returns {Promise<Object>}
     */
    async getSummary(affiliateId) {
        throw new Error('Método getSummary() não implementado');
    }

    /**
     * Obtém comissões por período
     * @param {string} affiliateId - UUID do afiliado
     * @param {Date} startDate - Data inicial
     * @param {Date} endDate - Data final
     * @returns {Promise<Array>}
     */
    async getByPeriod(affiliateId, startDate, endDate) {
        throw new Error('Método getByPeriod() não implementado');
    }
}

export default CommissionRepository;
