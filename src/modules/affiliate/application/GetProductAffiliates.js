import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError.js';

/**
 * Caso de uso: Obter afiliados de um produto (apenas para o vendedor)
 */
export class GetProductAffiliates {
    constructor(affiliateLinkRepository, productRepository, userRepository) {
        this.affiliateLinkRepository = affiliateLinkRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    async execute(productId, userId, page = 1, limit = 20) {
        // Verifica se o produto existe
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new NotFoundError('Produto não encontrado');
        }

        // Verifica se o usuário é o dono do produto ou admin
        const user = await this.userRepository.findById(userId);
        if (product.sellerId !== userId && user.role !== 'admin') {
            throw new ForbiddenError('Você não tem permissão para ver os afiliados deste produto');
        }

        // Lista afiliados do produto
        const result = await this.affiliateLinkRepository.listByProduct(productId, page, limit);

        return result;
    }
}

export default GetProductAffiliates;
