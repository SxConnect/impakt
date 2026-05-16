import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError.js';

/**
 * Caso de uso: Deletar produto (soft delete)
 */
export class DeleteProduct {
    constructor(productRepository, userRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    async execute(productId, userId) {
        // Busca o produto
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new NotFoundError('Produto não encontrado');
        }

        // Verifica se o usuário é o dono do produto ou admin
        const user = await this.userRepository.findById(userId);
        if (product.sellerId !== userId && user.role !== 'admin') {
            throw new ForbiddenError('Você não tem permissão para deletar este produto');
        }

        // Deleta o produto (soft delete)
        await this.productRepository.delete(productId);

        return { message: 'Produto deletado com sucesso' };
    }
}

export default DeleteProduct;
