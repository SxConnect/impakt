import { NotFoundError, ForbiddenError, ValidationError } from '../../../shared/errors/AppError.js';

/**
 * Caso de uso: Publicar produto (tornar ativo)
 */
export class PublishProduct {
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
            throw new ForbiddenError('Você não tem permissão para publicar este produto');
        }

        // Valida se o produto está pronto para publicação
        if (!product.name || product.name.trim().length < 3) {
            throw new ValidationError('Produto precisa ter um nome válido');
        }

        if (!product.priceCents || product.priceCents < 100) {
            throw new ValidationError('Produto precisa ter um preço válido');
        }

        // Valida configuração de comissões
        const commissionValidation = product.validateLevelCommissions();
        if (!commissionValidation.valid) {
            throw new ValidationError(commissionValidation.error);
        }

        // Valida distribuição de renda se habilitada
        const incomeValidation = product.validateIncomeDistribution();
        if (!incomeValidation.valid) {
            throw new ValidationError(incomeValidation.error);
        }

        // Publica o produto
        const publishedProduct = await this.productRepository.publish(productId);

        return publishedProduct;
    }
}

export default PublishProduct;
