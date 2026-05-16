import { pool } from '../../../shared/database/postgres.js';
import { Order } from '../domain/Order.js';
import { OrderRepository } from '../domain/OrderRepository.js';

/**
 * Implementação PostgreSQL do OrderRepository
 */
export class PostgresOrderRepository extends OrderRepository {
    /**
     * Cria um novo pedido
     */
    async create(order) {
        const query = `
            INSERT INTO orders (
                id, order_number, product_id, product_name, product_type,
                seller_id, buyer_id, affiliate_link_code, quantity,
                unit_price_cents, total_cents, platform_fee_cents,
                affiliate_amount_cents, seller_amount_cents, status,
                metadata, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING *
        `;

        const values = [
            order.id,
            order.orderNumber,
            order.productId,
            order.productName,
            order.productType,
            order.sellerId,
            order.buyerId,
            order.affiliateLinkCode,
            order.quantity,
            order.unitPriceCents,
            order.totalCents,
            order.platformFeeCents,
            order.affiliateAmountCents,
            order.sellerAmountCents,
            order.status,
            JSON.stringify(order.metadata),
            order.createdAt,
            order.updatedAt,
        ];

        const result = await pool.query(query, values);
        return this.mapToEntity(result.rows[0]);
    }

    /**
     * Busca pedido por ID
     */
    async findById(id) {
        const query = 'SELECT * FROM orders WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapToEntity(result.rows[0]);
    }

    /**
     * Busca pedido por número
     */
    async findByOrderNumber(orderNumber) {
        const query = 'SELECT * FROM orders WHERE order_number = $1';
        const result = await pool.query(query, [orderNumber]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapToEntity(result.rows[0]);
    }

    /**
     * Lista pedidos do comprador
     */
    async findByBuyer(buyerId, filters = {}, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const conditions = ['buyer_id = $1'];
        const values = [buyerId];
        let paramCount = 1;

        if (filters.status) {
            paramCount++;
            conditions.push(`status = $${paramCount}`);
            values.push(filters.status);
        }

        if (filters.productId) {
            paramCount++;
            conditions.push(`product_id = $${paramCount}`);
            values.push(filters.productId);
        }

        const whereClause = conditions.join(' AND ');

        // Query de contagem
        const countQuery = `SELECT COUNT(*) FROM orders WHERE ${whereClause}`;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count);

        // Query de dados
        const dataQuery = `
            SELECT * FROM orders
            WHERE ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;
        const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

        return {
            orders: dataResult.rows.map(row => this.mapToEntity(row)),
            total,
        };
    }

    /**
     * Lista pedidos do vendedor
     */
    async findBySeller(sellerId, filters = {}, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const conditions = ['seller_id = $1'];
        const values = [sellerId];
        let paramCount = 1;

        if (filters.status) {
            paramCount++;
            conditions.push(`status = $${paramCount}`);
            values.push(filters.status);
        }

        if (filters.productId) {
            paramCount++;
            conditions.push(`product_id = $${paramCount}`);
            values.push(filters.productId);
        }

        const whereClause = conditions.join(' AND ');

        // Query de contagem
        const countQuery = `SELECT COUNT(*) FROM orders WHERE ${whereClause}`;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count);

        // Query de dados
        const dataQuery = `
            SELECT * FROM orders
            WHERE ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;
        const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

        return {
            orders: dataResult.rows.map(row => this.mapToEntity(row)),
            total,
        };
    }

    /**
     * Lista pedidos do produto
     */
    async findByProduct(productId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        // Query de contagem
        const countQuery = 'SELECT COUNT(*) FROM orders WHERE product_id = $1';
        const countResult = await pool.query(countQuery, [productId]);
        const total = parseInt(countResult.rows[0].count);

        // Query de dados
        const dataQuery = `
            SELECT * FROM orders
            WHERE product_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const dataResult = await pool.query(dataQuery, [productId, limit, offset]);

        return {
            orders: dataResult.rows.map(row => this.mapToEntity(row)),
            total,
        };
    }

    /**
     * Atualiza pedido
     */
    async update(order) {
        const query = `
            UPDATE orders SET
                status = $1,
                payment_method = $2,
                payment_id = $3,
                paid_at = $4,
                completed_at = $5,
                cancelled_at = $6,
                cancellation_reason = $7,
                metadata = $8,
                updated_at = $9
            WHERE id = $10
            RETURNING *
        `;

        const values = [
            order.status,
            order.paymentMethod,
            order.paymentId,
            order.paidAt,
            order.completedAt,
            order.cancelledAt,
            order.cancellationReason,
            JSON.stringify(order.metadata),
            order.updatedAt,
            order.id,
        ];

        const result = await pool.query(query, values);
        return this.mapToEntity(result.rows[0]);
    }

    /**
     * Atualiza status do pedido
     */
    async updateStatus(id, status) {
        const query = `
            UPDATE orders SET
                status = $1,
                updated_at = $2
            WHERE id = $3
            RETURNING *
        `;

        const values = [status, new Date(), id];
        const result = await pool.query(query, values);
        return this.mapToEntity(result.rows[0]);
    }

    /**
     * Obtém estatísticas do vendedor
     */
    async getSellerStats(sellerId) {
        const query = `
            SELECT
                COUNT(*) as total_orders,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
                COUNT(*) FILTER (WHERE status = 'paid') as paid_orders,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
                COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
                COUNT(*) FILTER (WHERE status = 'refunded') as refunded_orders,
                COALESCE(SUM(total_cents) FILTER (WHERE status IN ('paid', 'completed')), 0) as total_revenue_cents,
                COALESCE(SUM(seller_amount_cents) FILTER (WHERE status IN ('paid', 'completed')), 0) as seller_revenue_cents,
                COALESCE(AVG(total_cents) FILTER (WHERE status IN ('paid', 'completed')), 0) as avg_order_value_cents
            FROM orders
            WHERE seller_id = $1
        `;

        const result = await pool.query(query, [sellerId]);
        const row = result.rows[0];

        return {
            totalOrders: parseInt(row.total_orders),
            pendingOrders: parseInt(row.pending_orders),
            paidOrders: parseInt(row.paid_orders),
            completedOrders: parseInt(row.completed_orders),
            cancelledOrders: parseInt(row.cancelled_orders),
            refundedOrders: parseInt(row.refunded_orders),
            totalRevenueCents: parseInt(row.total_revenue_cents),
            sellerRevenueCents: parseInt(row.seller_revenue_cents),
            avgOrderValueCents: Math.round(parseFloat(row.avg_order_value_cents)),
        };
    }

    /**
     * Obtém estatísticas do comprador
     */
    async getBuyerStats(buyerId) {
        const query = `
            SELECT
                COUNT(*) as total_orders,
                COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
                COUNT(*) FILTER (WHERE status = 'paid') as paid_orders,
                COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
                COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
                COALESCE(SUM(total_cents) FILTER (WHERE status IN ('paid', 'completed')), 0) as total_spent_cents,
                COALESCE(AVG(total_cents) FILTER (WHERE status IN ('paid', 'completed')), 0) as avg_order_value_cents
            FROM orders
            WHERE buyer_id = $1
        `;

        const result = await pool.query(query, [buyerId]);
        const row = result.rows[0];

        return {
            totalOrders: parseInt(row.total_orders),
            pendingOrders: parseInt(row.pending_orders),
            paidOrders: parseInt(row.paid_orders),
            completedOrders: parseInt(row.completed_orders),
            cancelledOrders: parseInt(row.cancelled_orders),
            totalSpentCents: parseInt(row.total_spent_cents),
            avgOrderValueCents: Math.round(parseFloat(row.avg_order_value_cents)),
        };
    }

    /**
     * Obtém vendas por período
     */
    async getSalesByPeriod(sellerId, startDate, endDate) {
        const query = `
            SELECT
                DATE(created_at) as date,
                COUNT(*) as count,
                COALESCE(SUM(total_cents), 0) as total_cents,
                COALESCE(SUM(seller_amount_cents), 0) as seller_amount_cents
            FROM orders
            WHERE seller_id = $1
                AND status IN ('paid', 'completed')
                AND created_at >= $2
                AND created_at <= $3
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `;

        const result = await pool.query(query, [sellerId, startDate, endDate]);

        return result.rows.map(row => ({
            date: row.date,
            count: parseInt(row.count),
            totalCents: parseInt(row.total_cents),
            sellerAmountCents: parseInt(row.seller_amount_cents),
        }));
    }

    /**
     * Mapeia linha do banco para entidade
     */
    mapToEntity(row) {
        return new Order({
            id: row.id,
            orderNumber: row.order_number,
            productId: row.product_id,
            productName: row.product_name,
            productType: row.product_type,
            sellerId: row.seller_id,
            buyerId: row.buyer_id,
            affiliateLinkCode: row.affiliate_link_code,
            quantity: row.quantity,
            unitPriceCents: row.unit_price_cents,
            totalCents: row.total_cents,
            platformFeeCents: row.platform_fee_cents,
            affiliateAmountCents: row.affiliate_amount_cents,
            sellerAmountCents: row.seller_amount_cents,
            status: row.status,
            paymentMethod: row.payment_method,
            paymentId: row.payment_id,
            paidAt: row.paid_at,
            completedAt: row.completed_at,
            cancelledAt: row.cancelled_at,
            cancellationReason: row.cancellation_reason,
            metadata: row.metadata || {},
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }
}

export default PostgresOrderRepository;
