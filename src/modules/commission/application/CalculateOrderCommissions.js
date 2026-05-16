import { NotFoundError } from '../../../shared/errors/AppError.js';
import { CommissionCalculator } from '../domain/CommissionCalculator.js';

/**
 * Caso de uso: Calcular comissões de um pedido
 * Este caso de uso será chamado ao criar um pedido
 */
export class CalculateOrderCommissions {
    constructor(
        commissionRepository,
        productRepository,
        userRepository,
        affiliateLinkRepository
    ) {
        this.commissionRepository = commissionRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.affiliateLinkRepository = affiliateLinkRepository;
    }

    async execute({ orderId, productId, affiliateCode, buyerId }) {
        // Busca o produto
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new NotFoundError('Produto não encontrado');
        }

        // Se não há código de afiliado, não há comissões
        if (!affiliateCode) {
            return {
                commissions: [],
                totalCommissionCents: 0,
            };
        }

        // Busca o link de afiliado
        const affiliateLink = await this.affiliateLinkRepository.findByCode(affiliateCode);
        if (!affiliateLink) {
            // Link inválido, não gera comissões mas não bloqueia a venda
            return {
                commissions: [],
                totalCommissionCents: 0,
            };
        }

        // Busca a cadeia de indicação do afiliado que vendeu
        const affiliateChain = await this.userRepository.getReferralChain(
            affiliateLink.affiliateId,
            product.maxAffiliateLevels
        );

        // Adiciona o afiliado que vendeu no início da cadeia
        const seller = await this.userRepository.findById(affiliateLink.affiliateId);
        const fullChain = [seller, ...affiliateChain];

        // Calcula o valor total para afiliados
        const totalCommissionCents = product.getAffiliateAmountCents();

        // Calcula as comissões usando a lógica de negócio
        const calculatedCommissions = CommissionCalculator.calculate({
            totalAmountCents: totalCommissionCents,
            affiliateChain: fullChain,
            levelCommission: product.levelCommission,
            sellerLevel: 1, // Quem vendeu está sempre no nível 1
        });

        // Ajusta arredondamento
        const adjustedCommissions = CommissionCalculator.adjustRounding(
            calculatedCommissions,
            totalCommissionCents
        );

        // Cria as comissões no banco
        const commissionsData = adjustedCommissions.map(comm => ({
            orderId,
            affiliateId: comm.affiliateId,
            productId,
            level: comm.level,
            pct: comm.pct,
            amountCents: comm.amountCents,
            status: 'held', // Começa retido (escrow)
        }));

        const commissions = await this.commissionRepository.createBatch(commissionsData);

        // Incrementa contador de conversões do link
        await this.affiliateLinkRepository.incrementConversions(affiliateCode);

        return {
            commissions,
            totalCommissionCents,
        };
    }
}

export default CalculateOrderCommissions;
