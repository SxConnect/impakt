/**
 * Caso de uso: Obter comissões do afiliado
 */
export class GetCommissions {
    constructor(commissionRepository) {
        this.commissionRepository = commissionRepository;
    }

    async execute(affiliateId, filters = {}, page = 1, limit = 20) {
        const result = await this.commissionRepository.listByAffiliate(
            affiliateId,
            filters,
            page,
            limit
        );

        return result;
    }
}

export default GetCommissions;
