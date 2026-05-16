/**
 * Entidade AffiliateLink - Domínio puro
 * Representa um link rastreável único de afiliado para um produto
 */
export class AffiliateLink {
  constructor({
    id,
    productId,
    affiliateId,
    code,
    clicks = 0,
    conversions = 0,
    createdAt,
  }) {
    this.id = id;
    this.productId = productId;
    this.affiliateId = affiliateId;
    this.code = code;
    this.clicks = clicks;
    this.conversions = conversions;
    this.createdAt = createdAt;
  }

  /**
   * Gera a URL completa do link de afiliado
   */
  getFullUrl(baseUrl) {
    return `${baseUrl}/p/${this.productId}?ref=${this.code}`;
  }

  /**
   * Calcula a taxa de conversão
   */
  getConversionRate() {
    if (this.clicks === 0) return '0.00';
    return ((this.conversions / this.clicks) * 100).toFixed(2);
  }

  /**
   * Verifica se o link tem performance boa (>5% conversão)
   */
  hasGoodPerformance() {
    return parseFloat(this.getConversionRate()) > 5;
  }

  /**
   * Incrementa contador de cliques
   */
  incrementClicks() {
    this.clicks++;
  }

  /**
   * Incrementa contador de conversões
   */
  incrementConversions() {
    this.conversions++;
  }

  /**
   * Retorna dados públicos do link
   */
  toPublic() {
    return {
      id: this.id,
      code: this.code,
      clicks: this.clicks,
      conversions: this.conversions,
      conversionRate: this.getConversionRate(),
      createdAt: this.createdAt,
    };
  }

  /**
   * Retorna dados completos do link
   */
  toJSON() {
    return {
      id: this.id,
      productId: this.productId,
      affiliateId: this.affiliateId,
      code: this.code,
      clicks: this.clicks,
      conversions: this.conversions,
      conversionRate: this.getConversionRate(),
      createdAt: this.createdAt,
    };
  }
}

export default AffiliateLink;
