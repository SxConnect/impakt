import { ValidationError, NotFoundError, ForbiddenError } from '../../../shared/errors/AppError.js';
import { slugify } from '../../../shared/utils/validators.js';

/**
 * Caso de uso: Atualizar produto
 */
export class UpdateProduct {
    constructor(productRepository, userRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    async execute(productId, userId, updates) {
        // Busca o produto
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new NotFoundError('Produto não encontrado');
        }

        // Verifica se o usuário é o dono do produto ou admin
        const user = await this.userRepository.findById(userId);
        if (product.sellerId !== userId && user.role !== 'admin') {
            throw new ForbiddenError('Você não tem permissão para editar este produto');
        }

        const allowedUpdates = {};

        // Validações e preparação dos dados
        if (updates.name !== undefined) {
            if (updates.name.trim().length < 3) {
                throw new ValidationError('Nome do produto deve ter no mínimo 3 caracteres');
            }
            allowedUpdates.name = updates.name.trim();

            // Atualiza slug se o nome mudou
            if (updates.slug === undefined) {
                allowedUpdates.slug = slugify(updates.name);
            }
        }

        if (updates.slug !== undefined) {
            const existingProduct = await this.productRepository.findBySlug(updates.slug);
            if (existingProduct && existingProduct.id !== productId) {
                throw new ValidationError('Slug já está em uso');
            }
            allowedUpdates.slug = updates.slug;
        }

        if (updates.description !== undefined) {
            allowedUpdates.description = updates.description?.trim() || null;
        }

        if (updates.shortDescription !== undefined) {
            allowedUpdates.shortDescription = updates.shortDescription?.trim() || null;
        }

        if (updates.categoryId !== undefined) {
            allowedUpdates.categoryId = updates.categoryId;
        }

        if (updates.priceCents !== undefined) {
            if (updates.priceCents < 100) {
                throw new ValidationError('Preço mínimo é R$ 1,00');
            }
            allowedUpdates.priceCents = updates.priceCents;
        }

        if (updates.affiliatePct !== undefined) {
            if (updates.affiliatePct < 25 || updates.affiliatePct > 50) {
                throw new ValidationError('Percentual de afiliados deve estar entre 25% e 50%');
            }
            allowedUpdates.affiliatePct = updates.affiliatePct;
        }

        if (updates.maxAffiliateLevels !== undefined) {
            if (updates.maxAffiliateLevels < 1 || updates.maxAffiliateLevels > 5) {
                throw new ValidationError('Número de níveis deve estar entre 1 e 5');
            }
            allowedUpdates.maxAffiliateLevels = updates.maxAffiliateLevels;
        }

        if (updates.levelCommission !== undefined) {
            const levels = updates.maxAffiliateLevels || product.maxAffiliateLevels;
            if (updates.levelCommission.length !== levels) {
                throw new ValidationError('Número de níveis de comissão não corresponde ao máximo definido');
            }

            const totalPct = updates.levelCommission.reduce((sum, level) => sum + parseFloat(level.pct), 0);
            if (Math.abs(totalPct - 100) > 0.01) {
                throw new ValidationError(`Soma das comissões (${totalPct}%) deve ser 100%`);
            }

            allowedUpdates.levelCommission = updates.levelCommission;
        }

        if (updates.incomeDistEnabled !== undefined) {
            allowedUpdates.incomeDistEnabled = updates.incomeDistEnabled;
        }

        if (updates.incomeDistConfig !== undefined) {
            if (updates.incomeDistConfig.length > 5) {
                throw new ValidationError('Máximo de 5 beneficiários permitidos');
            }

            const affiliatePct = updates.affiliatePct || product.affiliatePct;
            const totalPct = updates.incomeDistConfig.reduce((sum, dist) => sum + parseFloat(dist.pct), 0);
            if (totalPct > affiliatePct) {
                throw new ValidationError(
                    `Distribuição de renda (${totalPct}%) excede o valor destinado a afiliados (${affiliatePct}%)`
                );
            }

            // Valida se os beneficiários existem
            for (const dist of updates.incomeDistConfig) {
                const beneficiary = await this.userRepository.findById(dist.userId);
                if (!beneficiary) {
                    throw new ValidationError(`Beneficiário ${dist.userId} não encontrado`);
                }
            }

            allowedUpdates.incomeDistConfig = updates.incomeDistConfig;
        }

        if (updates.warrantyDays !== undefined) {
            if (updates.warrantyDays < 0 || updates.warrantyDays > 365) {
                throw new ValidationError('Garantia deve estar entre 0 e 365 dias');
            }
            allowedUpdates.warrantyDays = updates.warrantyDays;
        }

        if (updates.recurringDays !== undefined && product.isRecurring) {
            if (updates.recurringDays < 1 || updates.recurringDays > 365) {
                throw new ValidationError('Período de recorrência deve estar entre 1 e 365 dias');
            }
            allowedUpdates.recurringDays = updates.recurringDays;
        }

        // Atualiza o produto
        const updatedProduct = await this.productRepository.update(productId, allowedUpdates);

        return updatedProduct;
    }
}

export default UpdateProduct;
