import { formatCurrency } from '../../../shared/utils/validators.js';

/**
 * Caso de uso: Obter resumo de comissões do afiliado
 */
export class GetCommissionSummary {
    constructor(commissionRepository) {
        this.commissionRepository = commissionRepository;
    }

    async execute(affiliateId) {
        const summary = await this.commissionRepository.getSummary(affiliateId);

        return {
            ...summary,
            totalReleased: formatCurrency(summary.totalReleasedCents),
            totalHeld: formatCurrency(summary.totalHeldCents),
            totalPending: formatCurrency(summary.totalPendingCents),
            totalCancelled: formatCurrency(summary.totalCancelledCents),
            total: formatCurrency(
                summary.totalReleasedCents +
                summary.totalHeldCents +
                summary.totalPendingCents
            ),
        };
    }
}

export default GetCommissionSummary;
