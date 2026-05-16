/**
 * CommissionCalculator - Lógica pura de cálculo de comissões
 * Implementa a regra de negócio: quem vende recebe mais
 */
export class CommissionCalculator {
    /**
     * Calcula comissões para uma venda baseado na cadeia de afiliados
     * 
     * @param {Object} params
     * @param {number} params.totalAmountCents - Valor total destinado a afiliados
     * @param {Array} params.affiliateChain - Cadeia de afiliados [nivel1, nivel2, ...]
     * @param {Array} params.levelCommission - Config de % por nível [{level, pct}, ...]
     * @param {number} params.sellerLevel - Nível do afiliado que vendeu (1-5)
     * @returns {Array} Array de comissões [{affiliateId, level, pct, amountCents}, ...]
     */
    static calculate({ totalAmountCents, affiliateChain, levelCommission, sellerLevel }) {
        if (!affiliateChain || affiliateChain.length === 0) {
            return [];
        }

        const commissions = [];
        const totalLevels = levelCommission.length;

        // Encontra o percentual do vendedor (maior fatia)
        const sellerConfig = levelCommission.find(lc => lc.level === sellerLevel);
        if (!sellerConfig) {
            throw new Error(`Configuração não encontrada para nível ${sellerLevel}`);
        }

        // Distribui comissões
        for (let i = 0; i < affiliateChain.length && i < totalLevels; i++) {
            const affiliate = affiliateChain[i];
            const currentLevel = i + 1;

            let pct;

            // Se este afiliado é quem vendeu, recebe a maior fatia
            if (currentLevel === sellerLevel) {
                pct = sellerConfig.pct;
            } else {
                // Caso contrário, recebe o percentual do seu nível
                const levelConfig = levelCommission.find(lc => lc.level === currentLevel);
                pct = levelConfig ? levelConfig.pct : 0;
            }

            if (pct > 0) {
                const amountCents = Math.round((totalAmountCents * pct) / 100);

                commissions.push({
                    affiliateId: affiliate.id,
                    level: currentLevel,
                    pct: parseFloat(pct),
                    amountCents,
                });
            }
        }

        return commissions;
    }

    /**
     * Valida se a soma das comissões está correta
     */
    static validateTotal(commissions, expectedTotal) {
        const total = commissions.reduce((sum, c) => sum + c.amountCents, 0);
        const diff = Math.abs(total - expectedTotal);

        // Permite diferença de até 1 centavo por arredondamento
        return diff <= commissions.length;
    }

    /**
     * Ajusta arredondamento para garantir que a soma seja exata
     * Adiciona/remove centavos da maior comissão
     */
    static adjustRounding(commissions, expectedTotal) {
        const total = commissions.reduce((sum, c) => sum + c.amountCents, 0);
        const diff = expectedTotal - total;

        if (diff !== 0 && commissions.length > 0) {
            // Encontra a maior comissão e ajusta
            const maxCommission = commissions.reduce((max, c) =>
                c.amountCents > max.amountCents ? c : max
            );
            maxCommission.amountCents += diff;
        }

        return commissions;
    }

    /**
     * Calcula distribuição de renda para beneficiários
     * 
     * @param {Object} params
     * @param {number} params.totalAmountCents - Valor total destinado a distribuição
     * @param {Array} params.incomeDistConfig - Config [{userId, pct}, ...]
     * @returns {Array} Array de distribuições [{userId, pct, amountCents}, ...]
     */
    static calculateIncomeDistribution({ totalAmountCents, incomeDistConfig }) {
        if (!incomeDistConfig || incomeDistConfig.length === 0) {
            return [];
        }

        const distributions = incomeDistConfig.map(config => ({
            userId: config.userId,
            pct: parseFloat(config.pct),
            amountCents: Math.round((totalAmountCents * config.pct) / 100),
        }));

        return distributions;
    }

    /**
     * Calcula o valor que sobra para o vendedor após todas as deduções
     */
    static calculateSellerAmount({
        totalPriceCents,
        platformFeeCents,
        affiliateAmountCents,
        incomeDistAmountCents = 0
    }) {
        return totalPriceCents - platformFeeCents - affiliateAmountCents - incomeDistAmountCents;
    }
}

export default CommissionCalculator;
