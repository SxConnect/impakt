import { ValidationError, ConflictError, NotFoundError } from '../../../shared/errors/AppError.js';
import { slugify } from '../../../shared/utils/validators.js';

/**
 * Caso de uso: Criar novo produto
 */
export class CreateProduct {
    constructor(productRepository, userRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    async execute(sellerId, productData) {
        // Verifica se o vendedor existe e pode vender
        const seller = await this.userRepository.findById(sellerId);
        if (!seller) {
            throw new NotFoundError('Vendedor não encontrado');
        }

        if (!seller.canSell()) {
            throw new ValidationError('Usuário não tem permissão para vender produtos');
        }

        // Validações básicas
        if (!productData.name || productData.name.trim().length < 3) {
            throw new ValidationError('Nome do produto deve ter no mínimo 3 caracteres');
        }

        if (!productData.priceCents || productData.priceCents < 100) {
            throw new ValidationError('Preço mínimo é R$ 1,00');
        }

        if (!['physical', 'digital', 'service', 'subscription'].includes(productData.productType)) {
            throw new ValidationError('Tipo de produto inválido');
        }

        // Gera slug único
        let slug = productData.slug || slugify(productData.name);
        const existingProduct = await this.productRepository.findBySlug(slug);
        if (existingProduct) {
            // Adiciona timestamp para garantir unicidade
            slug = `${slug}-${Date.now()}`;
        }

        // Valida percentual de afiliados
        const affiliatePct = productData.affiliatePct || 25.00;
        if (affiliatePct < 25 || affiliatePct > 50) {
            throw new ValidationError('Percentual de afiliados deve estar entre 25% e 50%');
        }

        // Valida número de níveis
        const maxAffiliateLevels = productData.maxAffiliateLevels || 3;
        if (maxAffiliateLevels < 1 || maxAffiliateLevels > 5) {
            throw new ValidationError('Número de níveis deve estar entre 1 e 5');
        }

        // Gera configuração padrão de comissões se não fornecida
        let levelCommission = productData.levelCommission;
        if (!levelCommission || levelCommission.length === 0) {
            levelCommission = this._generateDefaultCommissions(maxAffiliateLevels);
        }

        // Valida configuração de comissões
        if (levelCommission.length !== maxAffiliateLevels) {
            throw new ValidationError('Número de níveis de comissão não corresponde ao máximo definido');
        }

        const totalCommissionPct = levelCommission.reduce((sum, level) => sum + parseFloat(level.pct), 0);
        if (Math.abs(totalCommissionPct - 100) > 0.01) {
            throw new ValidationError(`Soma das comissões (${totalCommissionPct}%) deve ser 100%`);
        }

        // Valida distribuição de renda se habilitada
        if (productData.incomeDistEnabled) {
            if (!productData.incomeDistConfig || productData.incomeDistConfig.length === 0) {
                throw new ValidationError('Distribuição de renda habilitada mas não configurada');
            }

            if (productData.incomeDistConfig.length > 5) {
                throw new ValidationError('Máximo de 5 beneficiários permitidos');
            }

            const totalDistPct = productData.incomeDistConfig.reduce((sum, dist) => sum + parseFloat(dist.pct), 0);
            if (totalDistPct > affiliatePct) {
                throw new ValidationError(
                    `Distribuição de renda (${totalDistPct}%) excede o valor destinado a afiliados (${affiliatePct}%)`
                );
            }

            // Valida se os beneficiários existem
            for (const dist of productData.incomeDistConfig) {
                const beneficiary = await this.userRepository.findById(dist.userId);
                if (!beneficiary) {
                    throw new ValidationError(`Beneficiário ${dist.userId} não encontrado`);
                }
            }
        }

        // Cria o produto
        const product = await this.productRepository.create({
            sellerId,
            categoryId: productData.categoryId || null,
            name: productData.name.trim(),
            slug,
            description: productData.description?.trim() || null,
            shortDescription: productData.shortDescription?.trim() || null,
            productType: productData.productType,
            status: 'draft',
            priceCents: productData.priceCents,
            isRecurring: productData.productType === 'subscription',
            recurringDays: productData.recurringDays || 30,
            affiliatePct,
            maxAffiliateLevels,
            levelCommission,
            incomeDistEnabled: productData.incomeDistEnabled || false,
            incomeDistConfig: productData.incomeDistConfig || [],
            warrantyDays: productData.warrantyDays || 7,
        });

        return product;
    }

    /**
     * Gera configuração padrão de comissões baseada no número de níveis
     */
    _generateDefaultCommissions(levels) {
        // Distribuição padrão: quem vende recebe mais
        const distributions = {
            1: [{ level: 1, pct: 100 }],
            2: [{ level: 1, pct: 60 }, { level: 2, pct: 40 }],
            3: [{ level: 1, pct: 50 }, { level: 2, pct: 30 }, { level: 3, pct: 20 }],
            4: [{ level: 1, pct: 40 }, { level: 2, pct: 30 }, { level: 3, pct: 20 }, { level: 4, pct: 10 }],
            5: [
                { level: 1, pct: 35 },
                { level: 2, pct: 25 },
                { level: 3, pct: 20 },
                { level: 4, pct: 12 },
                { level: 5, pct: 8 },
            ],
        };

        return distributions[levels] || distributions[3];
    }
}

export default CreateProduct;
