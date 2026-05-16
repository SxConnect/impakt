import { NotFoundError } from '../../../shared/errors/AppError.js';

/**
 * Caso de uso: Liberar comissões de um pedido
 * Chamado quando o escrow é liberado (após 7 dias ou confirmação)
 */
export class ReleaseCommissions {
    constructor(commissionRepository) {
        this.commissionRepository = commissionRepository;
    }

    async execute(orderId) {
        // Libera as comissões (held -> released)
        const commissions = await this.commissionRepository.releaseByOrder(orderId);

        if (commissions.length === 0) {
            throw new NotFoundError('Nenhuma comissão encontrada para este pedido');
        }

        // Calcula total liberado
        const totalReleased = commissions.reduce((sum, c) => sum + c.amountCents, 0);

        return {
            commissions,
            totalReleased,
            count: commissions.length,
        };
    }
}

export default ReleaseCommissions;
