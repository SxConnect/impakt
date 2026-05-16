/**
 * Interface (porta) do repositório de produtos
 */
export class ProductRepository {
    /**
     * Cria um novo produto
     * @param {Object} productData - Dados do produto
     * @returns {Promise<Product>}
     */
    async create(productData) {
        throw new Error('Método create() não implementado');
    }

    /**
     * Busca produto por ID
     * @param {string} id - UUID do produto
     * @returns {Promise<Product|null>}
     */
    async findById(id) {
        throw new Error('Método findById() não implementado');
    }

    /**
     * Busca produto por slug
     * @param {string} slug - Slug do produto
     * @returns {Promise<Product|null>}
     */
    async findBySlug(slug) {
        throw new Error('Método findBySlug() não implementado');
    }

    /**
     * Lista produtos com filtros e paginação
     * @param {Object} filters - Filtros de busca
     * @param {number} page - Página atual
     * @param {number} limit - Itens por página
     * @returns {Promise<{products: Product[], total: number}>}
     */
    async list(filters, page, limit) {
        throw new Error('Método list() não implementado');
    }

    /**
     * Lista produtos de um vendedor
     * @param {string} sellerId - UUID do vendedor
     * @param {number} page - Página atual
     * @param {number} limit - Itens por página
     * @returns {Promise<{products: Product[], total: number}>}
     */
    async listBySeller(sellerId, page, limit) {
        throw new Error('Método listBySeller() não implementado');
    }

    /**
     * Busca produtos por texto (full-text search)
     * @param {string} searchText - Texto de busca
     * @param {number} page - Página atual
     * @param {number} limit - Itens por página
     * @returns {Promise<{products: Product[], total: number}>}
     */
    async search(searchText, page, limit) {
        throw new Error('Método search() não implementado');
    }

    /**
     * Atualiza dados do produto
     * @param {string} id - UUID do produto
     * @param {Object} productData - Dados a serem atualizados
     * @returns {Promise<Product>}
     */
    async update(id, productData) {
        throw new Error('Método update() não implementado');
    }

    /**
     * Deleta produto (soft delete)
     * @param {string} id - UUID do produto
     * @returns {Promise<void>}
     */
    async delete(id) {
        throw new Error('Método delete() não implementado');
    }

    /**
     * Publica um produto (torna ativo)
     * @param {string} id - UUID do produto
     * @returns {Promise<Product>}
     */
    async publish(id) {
        throw new Error('Método publish() não implementado');
    }

    /**
     * Pausa um produto
     * @param {string} id - UUID do produto
     * @returns {Promise<Product>}
     */
    async pause(id) {
        throw new Error('Método pause() não implementado');
    }

    /**
     * Incrementa contador de vendas
     * @param {string} id - UUID do produto
     * @param {number} amountCents - Valor da venda em centavos
     * @returns {Promise<void>}
     */
    async incrementSales(id, amountCents) {
        throw new Error('Método incrementSales() não implementado');
    }
}

export default ProductRepository;
