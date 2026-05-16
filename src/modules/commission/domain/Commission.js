/**
 * Entidade Commission - Domínio puro
 * Representa uma comissão de afiliado por venda
 */
export class Commission {
    constructor({
        id,
        orderId,
        affiliateId,
        productId,
        level,
        pct,
        amountCents,
        status = 'pending',
        releasedAt,
        cancelledAt,
        createdAt,
    }) {
        this.id = id;
        this.orderId = orderId;
        this.affiliateId = affiliateId;
        this.productId = productId;
        this.level = level;
        this.pct = pct;
        this.amountCents = amountCents;
        this.status = status;
        this.releasedAt = releasedAt;
        this.cancelledAt = cancelledAt;
        this.createdAt = createdAt;
    }

    /**
     * Verifica se a comissão está pendente
     */
    isPending() {
        return this.status === 'pending';
    }

    /**
     * Verifica se a comissão está retida (escrow)
     */
    isHeld() {
        return this.status === 'held';
    }

    /**
     * Verifica se a comissão foi liberada
     */
    isReleased() {
        return this.status === 'released';
    }

    /**
     * Verifica se a comissão foi cancelada
     */
    isCancelled() {
        return this.status === 'cancelled';
    }

    /**
     * Formata o valor em reais
     */
    getFormattedAmount() {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(this.amountCents / 100);
    }

    /**
     * Retorna dados públicos da comissão
     */
    toJSON() {
        return {
            id: this.id,
            orderId: this.orderId,
            affiliateId: this.affiliateId,
            productId: this.productId,
            level: this.level,
            pct: this.pct,
            amountCents: this.amountCents,
            formattedAmount: this.getFormattedAmount(),
            status: this.status,
            releasedAt: this.releasedAt,
            cancelledAt: this.cancelledAt,
            createdAt: this.createdAt,
        };
    }
}

export default Commission;
