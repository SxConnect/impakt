/**
 * Entidade Product - Domínio puro
 * Representa um produto no marketplace (físico, digital, serviço ou assinatura)
 */
export class Product {
    constructor({
        id,
        sellerId,
        categoryId,
        name,
        slug,
        description,
        shortDescription,
        productType,
        status = 'draft',
        priceCents,
        isRecurring = false,
        recurringDays = 30,
        affiliatePct = 25.00,
        maxAffiliateLevels = 3,
        levelCommission = [],
        incomeDistEnabled = false,
        incomeDistConfig = [],
        warrantyDays = 7,
        totalSales = 0,
        totalRevenueCents = 0,
        avgRating = null,
        createdAt,
        updatedAt,
        publishedAt,
        deletedAt,
    }) {
        this.id = id;
        this.sellerId = sellerId;
        this.categoryId = categoryId;
        this.name = name;
        this.slug = slug;
        this.description = description;
        this.shortDescription = shortDescription;
        this.productType = productType;
        this.status = status;
        this.priceCents = priceCents;
        this.isRecurring = isRecurring;
        this.recurringDays = recurringDays;
        this.affiliatePct = affiliatePct;
        this.maxAffiliateLevels = maxAffiliateLevels;
        this.levelCommission = levelCommission;
        this.incomeDistEnabled = incomeDistEnabled;
        this.incomeDistConfig = incomeDistConfig;
        this.warrantyDays = warrantyDays;
        this.totalSales = totalSales;
        this.totalRevenueCents = totalRevenueCents;
        this.avgRating = avgRating;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.publishedAt = publishedAt;
        this.deletedAt = deletedAt;
    }

    /**
     * Calcula o valor total destinado a afiliados
     */
    getAffiliateAmountCents() {
        return Math.round((this.priceCents * this.affiliatePct) / 100);
    }

    /**
     * Calcula o valor da taxa da plataforma (1%)
     */
    getPlatformFeeCents() {
        return Math.round(this.priceCents * 0.01);
    }

    /**
     * Calcula o valor que o vendedor recebe
     */
    getSellerAmountCents() {
        return this.priceCents - this.getAffiliateAmountCents() - this.getPlatformFeeCents();
    }

    /**
     * Verifica se o produto está ativo
     */
    isActive() {
        return this.status === 'active' && !this.deletedAt;
    }

    /**
     * Verifica se o produto está publicado
     */
    isPublished() {
        return this.publishedAt !== null && this.isActive();
    }

    /**
     * Verifica se é um produto recorrente
     */
    isSubscription() {
        return this.isRecurring;
    }

    /**
     * Valida a configuração de comissões por nível
     * A soma deve ser 100% do valor destinado a afiliados
     */
    validateLevelCommissions() {
        if (!this.levelCommission || this.levelCommission.length === 0) {
            return { valid: false, error: 'Configuração de comissões não definida' };
        }

        if (this.levelCommission.length !== this.maxAffiliateLevels) {
            return {
                valid: false,
                error: `Número de níveis (${this.levelCommission.length}) não corresponde ao máximo (${this.maxAffiliateLevels})`
            };
        }

        const totalPct = this.levelCommission.reduce((sum, level) => sum + parseFloat(level.pct), 0);

        if (Math.abs(totalPct - 100) > 0.01) {
            return {
                valid: false,
                error: `Soma das comissões (${totalPct}%) deve ser 100%`
            };
        }

        return { valid: true };
    }

    /**
     * Valida a configuração de distribuição de renda
     * A soma não pode exceder o valor destinado a afiliados
     */
    validateIncomeDistribution() {
        if (!this.incomeDistEnabled) {
            return { valid: true };
        }

        if (!this.incomeDistConfig || this.incomeDistConfig.length === 0) {
            return { valid: false, error: 'Distribuição de renda habilitada mas não configurada' };
        }

        if (this.incomeDistConfig.length > 5) {
            return { valid: false, error: 'Máximo de 5 beneficiários permitidos' };
        }

        const totalPct = this.incomeDistConfig.reduce((sum, dist) => sum + parseFloat(dist.pct), 0);

        if (totalPct > this.affiliatePct) {
            return {
                valid: false,
                error: `Distribuição de renda (${totalPct}%) excede o valor destinado a afiliados (${this.affiliatePct}%)`
            };
        }

        return { valid: true };
    }

    /**
     * Formata o preço em reais
     */
    getFormattedPrice() {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(this.priceCents / 100);
    }

    /**
     * Retorna dados públicos do produto
     */
    toPublic() {
        return {
            id: this.id,
            name: this.name,
            slug: this.slug,
            shortDescription: this.shortDescription,
            productType: this.productType,
            priceCents: this.priceCents,
            formattedPrice: this.getFormattedPrice(),
            isRecurring: this.isRecurring,
            recurringDays: this.recurringDays,
            warrantyDays: this.warrantyDays,
            totalSales: this.totalSales,
            avgRating: this.avgRating,
            publishedAt: this.publishedAt,
        };
    }

    /**
     * Retorna dados completos do produto (para o vendedor)
     */
    toJSON() {
        return {
            id: this.id,
            sellerId: this.sellerId,
            categoryId: this.categoryId,
            name: this.name,
            slug: this.slug,
            description: this.description,
            shortDescription: this.shortDescription,
            productType: this.productType,
            status: this.status,
            priceCents: this.priceCents,
            formattedPrice: this.getFormattedPrice(),
            isRecurring: this.isRecurring,
            recurringDays: this.recurringDays,
            affiliatePct: this.affiliatePct,
            maxAffiliateLevels: this.maxAffiliateLevels,
            levelCommission: this.levelCommission,
            incomeDistEnabled: this.incomeDistEnabled,
            incomeDistConfig: this.incomeDistConfig,
            warrantyDays: this.warrantyDays,
            totalSales: this.totalSales,
            totalRevenueCents: this.totalRevenueCents,
            avgRating: this.avgRating,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            publishedAt: this.publishedAt,
            // Valores calculados
            affiliateAmountCents: this.getAffiliateAmountCents(),
            platformFeeCents: this.getPlatformFeeCents(),
            sellerAmountCents: this.getSellerAmountCents(),
        };
    }
}

export default Product;
