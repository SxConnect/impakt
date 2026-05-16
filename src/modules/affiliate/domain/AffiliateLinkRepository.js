/**
 * Interface (porta) do repositório de links de afiliados
 */
export class AffiliateLinkRepository {
    /**
     * Cria um novo link de afiliado
     * @param {Object} linkData - Dados do link
     * @returns {Promise<AffiliateLink>}
     */
    async create(linkData) {
        throw new Error('Método create() não implementado');
    }

    /**
     * Busca link por ID
     * @param {string} id - UUID do link
     * @returns {Promise<AffiliateLink|null>}
     */
    async findById(id) {
        throw new Error('Método findById() não implementado');
    }

    /**
     * Busca link por código
     * @param {string} code - Código do link
     * @returns {Promise<AffiliateLink|null>}
     */
    async findByCode(code) {
        throw new Error('Método findByCode() não implementado');
    }

    /**
     * Busca link por produto e afiliado
     * @param {string} productId - UUID do produto
     * @param {string} affiliateId - UUID do afiliado
     * @returns {Promise<AffiliateLink|null>}
     */
    async findByProductAndAffiliate(productId, affiliateId) {
        throw new Error('Método findByProductAndAffiliate() não implementado');
    }

    /**
     * Lista links de um afiliado
     * @param {string} affiliateId - UUID do afiliado
     * @param {number} page - Página atual
     * @param {number} limit - Itens por página
     * @returns {Promise<{links: AffiliateLink[], total: number}>}
     */
    async listByAffiliate(affiliateId, page, limit) {
        throw new Error('Método listByAffiliate() não implementado');
    }

    /**
     * Lista links de um produto
     * @param {string} productId - UUID do produto
     * @param {number} page - Página atual
     * @param {number} limit - Itens por página
     * @returns {Promise<{links: AffiliateLink[], total: number}>}
     */
    async listByProduct(productId, page, limit) {
        throw new Error('Método listByProduct() não implementado');
    }

    /**
     * Incrementa contador de cliques
     * @param {string} code - Código do link
     * @returns {Promise<void>}
     */
    async incrementClicks(code) {
        throw new Error('Método incrementClicks() não implementado');
    }

    /**
     * Incrementa contador de conversões
     * @param {string} code - Código do link
     * @returns {Promise<void>}
     */
    async incrementConversions(code) {
        throw new Error('Método incrementConversions() não implementado');
    }

    /**
     * Obtém estatísticas do afiliado
     * @param {string} affiliateId - UUID do afiliado
     * @returns {Promise<Object>}
     */
    async getAffiliateStats(affiliateId) {
        throw new Error('Método getAffiliateStats() não implementado');
    }

    /**
     * Obtém top produtos do afiliado
     * @param {string} affiliateId - UUID do afiliado
     * @param {number} limit - Número de produtos
     * @returns {Promise<Array>}
     */
    async getTopProducts(affiliateId, limit) {
        throw new Error('Método getTopProducts() não implementado');
    }
}

export default AffiliateLinkRepository;
