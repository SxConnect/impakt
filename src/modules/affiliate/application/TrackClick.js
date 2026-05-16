import { NotFoundError } from '../../../shared/errors/AppError.js';

/**
 * Caso de uso: Rastrear clique em link de afiliado
 */
export class TrackClick {
    constructor(affiliateLinkRepository) {
        this.affiliateLinkRepository = affiliateLinkRepository;
    }

    async execute(code) {
        // Busca o link pelo código
        const link = await this.affiliateLinkRepository.findByCode(code);

        if (!link) {
            throw new NotFoundError('Link de afiliado não encontrado');
        }

        // Incrementa contador de cliques
        await this.affiliateLinkRepository.incrementClicks(code);

        return {
            productId: link.productId,
            affiliateId: link.affiliateId,
            tracked: true,
        };
    }
}

export default TrackClick;
