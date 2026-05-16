import { ValidationError } from '../../../shared/errors/AppError.js';
import { formatCurrency } from '../../../shared/utils/validators.js';

/**
 * Caso de uso: Obter comissões por período
 */
export class GetCommissionsByPeriod {
    constructor(commissionRepository) {
        this.commissionRepository = commissionRepository;
    }

    async execute(affiliateId, startDate, endDate) {
        // Validações
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime())) {
            throw new ValidationError('Data inicial inválida');
        }

        if (isNaN(end.getTime())) {
            throw new ValidationError('Data final inválida');
        }

        if (start > end) {
            throw new ValidationError('Data inicial deve ser anterior à data final');
        }

        // Limita a 1 ano
        const diffDays = (end - start) / (1000 * 60 * 60 * 24);
        if (diffDays > 365) {
            throw new ValidationError('Período máximo é de 1 ano');
        }

        const data = await this.commissionRepository.getByPeriod(
            affiliateId,
            start,
            end
        );

        return data.map(item => ({
            ...item,
            total: formatCurrency(item.totalCents),
        }));
    }
}

export default GetCommissionsByPeriod;
