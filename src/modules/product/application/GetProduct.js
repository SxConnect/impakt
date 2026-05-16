import { NotFoundError } from '../../../shared/errors/AppError.js';

/**
 * Caso de uso: Obter produto por ID
 */
export class GetProduct {
    constructor(productRepository) {
        this.productRepository = productRepository;
    }

    async execute(productId, userId = null) {
        const product = await this.productRepository.findById(productId);

        if (!product) {
            throw new NotFoundError('Produto não encontrado');
        }

        // Se o usuário é o dono ou admin, retorna dados completos
        if (userId && (product.sellerId === userId || userId === 'admin')) {
            return product.toJSON();
        }

        // Caso contrário, retorna apenas dados públicos
        return product.toPublic();
    }
}

export default GetProduct;
