import { ValidationError, NotFoundError } from '../../../shared/errors/AppError.js';
import { generateCode } from '../../../shared/utils/validators.js';

/**
 * Caso de uso: Gerar link de afiliado para um produto
 */
export class GenerateAffiliateLink {
    constructor(affiliateLinkRepository, productRepository, userRepository) {
        this.affiliateLinkRepository = affiliateLinkRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    async execute(affiliateId, productId) {
        // Verifica se o usuário existe e pode ser afiliado
        const user = await this.userRepository.findById(affiliateId);
        if (!user) {
            throw new NotFoundError('Usuário não encontrado');
        }

        if (!user.canAffiliate()) {
            throw new ValidationError('Usuário não tem permissão para ser afiliado');
        }

        // Verifica se o produto existe e está ativo
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new NotFoundError('Produto não encontrado');
        }

        if (!product.isPublished()) {
            throw new ValidationError('Produto não está publicado');
        }

        // Verifica se já existe um link para este produto e afiliado
        const existingLink = await this.affiliateLinkRepository.findByProductAndAffiliate(
            productId,
            affiliateId
        );

        if (existingLink) {
            return existingLink;
        }

        // Gera código único
        let code = generateCode(8);
        let attempts = 0;

        while (await this.affiliateLinkRepository.findByCode(code)) {
            code = generateCode(8);
            attempts++;
            if (attempts > 10) {
                throw new Error('Erro ao gerar código único de afiliado');
            }
        }

        // Cria o link
        const link = await this.affiliateLinkRepository.create({
            productId,
            affiliateId,
            code,
        });

        return link;
    }
}

export default GenerateAffiliateLink;
