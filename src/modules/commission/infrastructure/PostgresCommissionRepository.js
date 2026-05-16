import { query, transaction } from '../../../shared/database/postgres.js';
import { CommissionRepository } from '../domain/CommissionRepository.js';
import { Commission } from '../domain/Commission.js';

/**
 * Implementação PostgreSQL do repositório de comissões
 */
export class PostgresCommissionRepository extends CommissionRepository {
    /**
     * Converte linha do banco para entidade Commission
     */
    _toEntity(row) {
        if (!row) return null;

        return new Commission({
            id: row.id,
            orderId: row.order_id,
            affiliateId: row.affiliate_id,
            productId: row.product_id,
            level: row.level,
            pct: parseFloat(row.pct),
            amountCents: row.amount_cents,
            status: row.status,
            releasedAt: row.released_at,
            cancelledAt: row.cancelled_at,
            createdAt: row.created_at,
        });
    }

    async createBatch(commissionsData) {
        return await transaction(async (client) => {
            const commissions = [];

            for (const data of commissionsData) {
                const sql = `
          INSERT INTO commissions (
            order_id, affiliate_id, product_id, level, pct, amount_cents, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;

                const values = [
                    data.orderId,
                    data.affiliateId,
                    data.productId,
                    data.level,
                    data.pct,
                    data.amountCents,
                    data.status || 'pending',
                ];

                const result = await client.query(sql, values);
                commissions.push(this._toEntity(result.rows[0]));
            }

            return commissions;
        });
    }

    async findById(id) {
        const sql = 'SELECT * FROM commissions WHERE id = $1';
        const result = await query(sql, [id]);
        return this._toEntity(result.rows[0]);
    }

    async listByAffiliate(affiliateId, filters = {}, page = 1, limit = 20) {
        const conditions = ['affiliate_id = $1'];
        const values = [affiliateId];
        let paramCount = 2;

        if (filters.status) {
            conditions.push(`status = $${paramCount++}`);
            values.push(filters.status);
        }

        if (filters.productId) {
            conditions.push(`product_id = $${paramCount++}`);
            values.push(filters.productId);
        }

        const whereClause = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        // Query de contagem
        const countSql = `SELECT COUNT(*) FROM commissions WHERE ${whereClause}`;
        const countResult = await query(countSql, values);
        const total = parseInt(countResult.rows[0].count);

        // Query de dados com informações do produto e pedido
        const dataSql = `
      SELECT 
        c.*,
        p.name as product_name,
        p.price_cents as product_price,
        o.amount_cents as order_amount,
        o.status as order_status,
        o.created_at as order_date
      FROM commissions c
      INNER JOIN products p ON c.product_id = p.id
      INNER JOIN orders o ON c.order_id = o.id
      WHERE ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
        const dataResult = await query(dataSql, [...values, limit, offset]);

        return {
            commissions: dataResult.rows.map(row => ({
                ...this._toEntity(row).toJSON(),
                product: {
                    name: row.product_name,
                    priceCents: row.product_price,
                },
                order: {
                    amountCents: row.order_amount,
                    status: row.order_status,
                    date: row.order_date,
                },
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async listByOrder(orderId) {
        const sql = `
      SELECT c.*, u.full_name as affiliate_name, u.email as affiliate_email
      FROM commissions c
      INNER JOIN users u ON c.affiliate_id = u.id
      WHERE c.order_id = $1
      ORDER BY c.level ASC
    `;
        const result = await query(sql, [orderId]);

        return result.rows.map(row => ({
            ...this._toEntity(row).toJSON(),
            affiliate: {
                name: row.affiliate_name,
                email: row.affiliate_email,
            },
        }));
    }

    async updateStatusByOrder(orderId, newStatus) {
        const sql = `
      UPDATE commissions 
      SET status = $1
      WHERE order_id = $2
    `;
        await query(sql, [newStatus, orderId]);
    }

    async releaseByOrder(orderId) {
        const sql = `
      UPDATE commissions 
      SET status = 'released', released_at = NOW()
      WHERE order_id = $1 AND status = 'held'
      RETURNING *
    `;
        const result = await query(sql, [orderId]);
        return result.rows.map(row => this._toEntity(row));
    }

    async cancelByOrder(orderId) {
        const sql = `
      UPDATE commissions 
      SET status = 'cancelled', cancelled_at = NOW()
      WHERE order_id = $1 AND status IN ('pending', 'held')
    `;
        await query(sql, [orderId]);
    }

    async getSummary(affiliateId) {
        const sql = `
      SELECT 
        COUNT(*) as total_commissions,
        COALESCE(SUM(amount_cents) FILTER (WHERE status = 'released'), 0) as total_released_cents,
        COALESCE(SUM(amount_cents) FILTER (WHERE status = 'held'), 0) as total_held_cents,
        COALESCE(SUM(amount_cents) FILTER (WHERE status = 'pending'), 0) as total_pending_cents,
        COALESCE(SUM(amount_cents) FILTER (WHERE status = 'cancelled'), 0) as total_cancelled_cents,
        COUNT(DISTINCT product_id) as products_count,
        COUNT(DISTINCT order_id) as orders_count,
        AVG(pct) as avg_commission_pct
      FROM commissions
      WHERE affiliate_id = $1
    `;

        const result = await query(sql, [affiliateId]);
        const row = result.rows[0];

        return {
            totalCommissions: parseInt(row.total_commissions),
            totalReleasedCents: parseInt(row.total_released_cents),
            totalHeldCents: parseInt(row.total_held_cents),
            totalPendingCents: parseInt(row.total_pending_cents),
            totalCancelledCents: parseInt(row.total_cancelled_cents),
            productsCount: parseInt(row.products_count),
            ordersCount: parseInt(row.orders_count),
            avgCommissionPct: row.avg_commission_pct ? parseFloat(row.avg_commission_pct) : 0,
        };
    }

    async getByPeriod(affiliateId, startDate, endDate) {
        const sql = `
      SELECT 
        DATE(c.created_at) as date,
        COUNT(*) as count,
        SUM(c.amount_cents) as total_cents,
        COUNT(DISTINCT c.order_id) as orders_count
      FROM commissions c
      WHERE c.affiliate_id = $1
        AND c.created_at >= $2
        AND c.created_at <= $3
        AND c.status != 'cancelled'
      GROUP BY DATE(c.created_at)
      ORDER BY date DESC
    `;

        const result = await query(sql, [affiliateId, startDate, endDate]);

        return result.rows.map(row => ({
            date: row.date,
            count: parseInt(row.count),
            totalCents: parseInt(row.total_cents),
            ordersCount: parseInt(row.orders_count),
        }));
    }
}

export default PostgresCommissionRepository;
