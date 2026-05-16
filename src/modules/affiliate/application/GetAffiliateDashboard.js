import { NotFoundError } from '../../../shared/errors/AppError.js';
import { formatCurrency } from '../../../shared/utils/validators.js';

/**
 * Caso de uso: Obter dashboard do afiliado com estatísticas
 */
export class GetAffiliateDashboard {
    constructor(affiliateLinkRepository, userRepository) {
        this.affiliateLinkRepository = affiliateLinkRepository;
        this.userRepository = userRepository;
    }

    async execute(affiliateId) {
        // Verifica se o usuário existe
        const user = await this.userRepository.findById(affiliateId);
        if (!user) {
            throw new NotFoundError('Usuário não encontrado');
        }

        // Obtém estatísticas gerais
        const stats = await this.affiliateLinkRepository.getAffiliateStats(affiliateId);

        // Obtém top produtos
        const topProducts = await this.affiliateLinkRepository.getTopProducts(affiliateId, 5);

        // Obtém links recentes
        const recentLinks = await this.affiliateLinkRepository.listByAffiliate(affiliateId, 1, 5);

        return {
            affiliate: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                referralCode: user.referralCode,
            },
            stats: {
                ...stats,
                totalEarned: formatCurrency(stats.totalEarnedCents),
                pending: formatCurrency(stats.pendingCents),
            },
            topProducts: topProducts.map(p => ({
                ...p,
                earned: formatCurrency(p.earnedCents),
                price: formatCurrency(p.priceCents),
            })),
            recentLinks: recentLinks.links,
        };
    }
}

export default GetAffiliateDashboard;
