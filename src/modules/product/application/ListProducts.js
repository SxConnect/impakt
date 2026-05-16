/**
 * Caso de uso: Listar produtos com filtros
 */
export class ListProducts {
    constructor(productRepository) {
        this.productRepository = productRepository;
    }

    async execute(filters = {}, page = 1, limit = 20) {
        // Se houver texto de busca, usa full-text search
        if (filters.search) {
            const result = await this.productRepository.search(filters.search, page, limit);
            return {
                ...result,
                products: result.products.map(p => p.toPublic()),
            };
        }

        // Caso contrário, usa filtros normais
        const result = await this.productRepository.list(filters, page, limit);

        return {
            ...result,
            products: result.products.map(p => p.toPublic()),
        };
    }
}

export default ListProducts;
