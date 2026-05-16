/**
 * Caso de uso: Obter links de afiliado
 */
export class GetAffiliateLinks {
    constructor(affiliateLinkRepository) {
        this.affiliateLinkRepository = affiliateLinkRepository;
    }

    async execute(affiliateId, page = 1, limit = 20) {
        const result = await this.affiliateLinkRepository.listByAffiliate(
            affiliateId,
            page,
            limit
        );

        return result;
    }
}

export default GetAffiliateLinks;
