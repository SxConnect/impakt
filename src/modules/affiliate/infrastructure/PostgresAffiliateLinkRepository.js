import { query } from '../../../shared/database/postgres.js';
import { AffiliateLinkRepository } from '../domain/AffiliateLinkRepository.js';
import { AffiliateLink } from '../domain/AffiliateLink.js';

/**
 * Implementação PostgreSQL do repositório de links de afiliados
 */
export class PostgresAffiliateLinkRepository extends AffiliateLinkRepository {
    /**
     * Converte linha do banco para entidade AffiliateLink
     */
    _toEntity(row) {
        if (!row) return null;

        return new AffiliateLink({
            id: row.id,
            productId: row.product_id,
            affiliateId: row.affiliate_id,
            code: row.code,
            clicks: row.clicks,
            conversions: row.conversions,
            createdAt: row.created_at,
        });
    }

    async create(linkData) {
        const sql = `
      INSERT INTO affiliate_links (
        product_id, affiliate_id, code
      ) VALUES ($1, $2, $3)
      RETURNING *
    `;

        const values = [
            linkData.productId,
            linkData.affiliateId,
            linkData.code,
        ];

        const result = await query(sql, values);
        return this._toEntity(result.rows[0]);
    }

    async findById(id) {
        const sql = 'SELECT * FROM affiliate_links WHERE id = $1';
        const result = await query(sql, [id]);
        return this._toEntity(result.rows[0]);
    }

    async findByCode(code) {
        const sql = 'SELECT * FROM affiliate_links WHERE code = $1';
        const result = await query(sql, [code]);
        return this._toEntity(result.rows[0]);
    }

    async findByProductAndAffiliate(productId, affiliateId) {
        const sql = `
      SELECT * FROM affiliate_links 
      WHERE product_id = $1 AND affiliate_id = $2
    `;
        const result = await query(sql, [productId, affiliateId]);
        return this._toEntity(result.rows[0]);
    }

    async listByAffiliate(affiliateId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        // Query de contagem
        const countSql = `
      SELECT COUNT(*) FROM affiliate_links 
      WHERE affiliate_id = $1
    `;
        const countResult = await query(countSql, [affiliateId]);
        const total = parseInt(countResult.rows[0].count);

        // Query de dados com informações do produto
        const dataSql = `
      SELECT 
        al.*,
        p.name as product_name,
        p.price_cents as product_price,
        p.status as product_status
      FROM affiliate_links al
      INNER JOIN products p ON al.product_id = p.id
      WHERE al.affiliate_id = $1
      ORDER BY al.created_at DESC
      LIMIT $2 OFFSET $3
    `;
        const dataResult = await query(dataSql, [affiliateId, limit, offset]);

        return {
            links: dataResult.rows.map(row => ({
                ...this._toEntity(row).toJSON(),
                product: {
                    name: row.product_name,
                    priceCents: row.product_price,
                    status: row.product_status,
                },
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async listByProduct(productId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        // Query de contagem
        const countSql = `
      SELECT COUNT(*) FROM affiliate_links 
      WHERE product_id = $1
    `;
        const countResult = await query(countSql, [productId]);
        const total = parseInt(countResult.rows[0].count);

        // Query de dados com informações do afiliado
        const dataSql = `
      SELECT 
        al.*,
        u.full_name as affiliate_name,
        u.email as affiliate_email
      FROM affiliate_links al
      INNER JOIN users u ON al.affiliate_id = u.id
      WHERE al.product_id = $1
      ORDER BY al.conversions DESC, al.clicks DESC
      LIMIT $2 OFFSET $3
    `;
        const dataResult = await query(dataSql, [productId, limit, offset]);

        return {
            links: dataResult.rows.map(row => ({
                ...this._toEntity(row).toJSON(),
                affiliate: {
                    name: row.affiliate_name,
                    email: row.affiliate_email,
                },
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async incrementClicks(code) {
        const sql = `
      UPDATE affiliate_links 
      SET clicks = clicks + 1
      WHERE code = $1
    `;
        await query(sql, [code]);
    }

    async incrementConversions(code) {
        const sql = `
      UPDATE affiliate_links 
      SET conversions = conversions + 1
      WHERE code = $1
    `;
        await query(sql, [code]);
    }

    async getAffiliateStats(affiliateId) {
        const sql = `
      SELECT 
        COUNT(DISTINCT al.id) as total_links,
        COALESCE(SUM(al.clicks), 0) as total_clicks,
        COALESCE(SUM(al.conversions), 0) as total_conversions,
        CASE 
          WHEN SUM(al.clicks) > 0 
          THEN ROUND((SUM(al.conversions)::numeric / SUM(al.clicks)::numeric * 100), 2)
          ELSE 0 
        END as conversion_rate,
        COUNT(DISTINCT al.product_id) as products_promoted,
        COALESCE(SUM(c.amount_cents) FILTER (WHERE c.status = 'released'), 0) as total_earned_cents,
        COALESCE(SUM(c.amount_cents) FILTER (WHERE c.status = 'held'), 0) as pending_cents
      FROM affiliate_links al
      LEFT JOIN commissions c ON c.affiliate_id = al.affiliate_id
      WHERE al.affiliate_id = $1
      GROUP BY al.affiliate_id
    `;

        const result = await query(sql, [affiliateId]);

        if (result.rows.length === 0) {
            return {
                totalLinks: 0,
                totalClicks: 0,
                totalConversions: 0,
                conversionRate: 0,
                productsPromoted: 0,
                totalEarnedCents: 0,
                pendingCents: 0,
            };
        }

        const row = result.rows[0];
        return {
            totalLinks: parseInt(row.total_links),
            totalClicks: parseInt(row.total_clicks),
            totalConversions: parseInt(row.total_conversions),
            conversionRate: parseFloat(row.conversion_rate),
            productsPromoted: parseInt(row.products_promoted),
            totalEarnedCents: parseInt(row.total_earned_cents),
            pendingCents: parseInt(row.pending_cents),
        };
    }

    async getTopProducts(affiliateId, limit = 10) {
        const sql = `
      SELECT 
        p.id,
        p.name,
        p.price_cents,
        al.clicks,
        al.conversions,
        CASE 
          WHEN al.clicks > 0 
          THEN ROUND((al.conversions::numeric / al.clicks::numeric * 100), 2)
          ELSE 0 
        END as conversion_rate,
        COALESCE(SUM(c.amount_cents) FILTER (WHERE c.status = 'released'), 0) as earned_cents
      FROM affiliate_links al
      INNER JOIN products p ON al.product_id = p.id
      LEFT JOIN commissions c ON c.affiliate_id = al.affiliate_id AND c.product_id = p.id
      WHERE al.affiliate_id = $1
      GROUP BY p.id, p.name, p.price_cents, al.clicks, al.conversions
      ORDER BY earned_cents DESC, al.conversions DESC
      LIMIT $2
    `;

        const result = await query(sql, [affiliateId, limit]);

        return result.rows.map(row => ({
            productId: row.id,
            productName: row.name,
            priceCents: row.price_cents,
            clicks: row.clicks,
            conversions: row.conversions,
            conversionRate: parseFloat(row.conversion_rate),
            earnedCents: parseInt(row.earned_cents),
        }));
    }
}

export default PostgresAffiliateLinkRepository;
