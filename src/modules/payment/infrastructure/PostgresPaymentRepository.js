import { pool } from '../../../shared/database/postgres.js';
import { Payment } from '../domain/Payment.js';
import { PaymentRepository } from '../domain/PaymentRepository.js';

/**
 * Implementação PostgreSQL do PaymentRepository
 */
export class PostgresPaymentRepository extends PaymentRepository {
    /**
     * Cria um novo pagamento
     */
    async create(payment) {
        const query = `
            INSERT INTO payments (
                id, order_id, provider, provider_payment_id, provider_customer_id,
                method, amount_cents, status, installments,
                card_brand, card_last_digits,
                boleto_url, boleto_barcode,
                pix_qr_code, pix_qr_code_url,
                metadata, provider_response,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *
        `;

        const values = [
            payment.id,
            payment.orderId,
            payment.provider,
            payment.providerPaymentId,
            payment.providerCustomerId,
            payment.method,
            payment.amountCents,
            payment.status,
            payment.installments,
            payment.cardBrand,
            payment.cardLastDigits,
            payment.boletoUrl,
            payment.boletoBarcode,
            payment.pixQrCode,
            payment.pixQrCodeUrl,
            JSON.stringify(payment.metadata),
            JSON.stringify(payment.providerResponse),
            payment.createdAt,
            payment.updatedAt,
        ];

        const result = await pool.query(query, values);
        return this.mapToEntity(result.rows[0]);
    }

    /**
     * Busca pagamento por ID
     */
    async findById(id) {
        const query = 'SELECT * FROM payments WHERE id = $1';
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapToEntity(result.rows[0]);
    }

    /**
     * Busca pagamento por ID do pedido
     */
    async findByOrderId(orderId) {
        const query = 'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1';
        const result = await pool.query(query, [orderId]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapToEntity(result.rows[0]);
    }

    /**
     * Busca pagamento por ID do provider
     */
    async findByProviderPaymentId(providerPaymentId) {
        const query = 'SELECT * FROM payments WHERE provider_payment_id = $1';
        const result = await pool.query(query, [providerPaymentId]);

        if (result.rows.length === 0) {
            return null;
        }

        return this.mapToEntity(result.rows[0]);
    }

    /**
     * Atualiza pagamento
     */
    async update(payment) {
        const query = `
            UPDATE payments SET
                provider_payment_id = $1,
                provider_customer_id = $2,
                status = $3,
                paid_at = $4,
                refunded_at = $5,
                refund_reason = $6,
                card_brand = $7,
                card_last_digits = $8,
                boleto_url = $9,
                boleto_barcode = $10,
                pix_qr_code = $11,
                pix_qr_code_url = $12,
                metadata = $13,
                provider_response = $14,
                updated_at = $15
            WHERE id = $16
            RETURNING *
        `;

        const values = [
            payment.providerPaymentId,
            payment.providerCustomerId,
            payment.status,
            payment.paidAt,
            payment.refundedAt,
            payment.refundReason,
            payment.cardBrand,
            payment.cardLastDigits,
            payment.boletoUrl,
            payment.boletoBarcode,
            payment.pixQrCode,
            payment.pixQrCodeUrl,
            JSON.stringify(payment.metadata),
            JSON.stringify(payment.providerResponse),
            payment.updatedAt,
            payment.id,
        ];

        const result = await pool.query(query, values);
        return this.mapToEntity(result.rows[0]);
    }

    /**
     * Lista pagamentos com filtros
     */
    async findAll(filters = {}, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let paramCount = 0;

        if (filters.status) {
            paramCount++;
            conditions.push(`status = $${paramCount}`);
            values.push(filters.status);
        }

        if (filters.provider) {
            paramCount++;
            conditions.push(`provider = $${paramCount}`);
            values.push(filters.provider);
        }

        if (filters.method) {
            paramCount++;
            conditions.push(`method = $${paramCount}`);
            values.push(filters.method);
        }

        if (filters.orderId) {
            paramCount++;
            conditions.push(`order_id = $${paramCount}`);
            values.push(filters.orderId);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Query de contagem
        const countQuery = `SELECT COUNT(*) FROM payments ${whereClause}`;
        const countResult = await pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count);

        // Query de dados
        const dataQuery = `
            SELECT * FROM payments
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;
        const dataResult = await pool.query(dataQuery, [...values, limit, offset]);

        return {
            payments: dataResult.rows.map(row => this.mapToEntity(row)),
            total,
        };
    }

    /**
     * Mapeia linha do banco para entidade
     */
    mapToEntity(row) {
        return new Payment({
            id: row.id,
            orderId: row.order_id,
            provider: row.provider,
            providerPaymentId: row.provider_payment_id,
            providerCustomerId: row.provider_customer_id,
            method: row.method,
            amountCents: row.amount_cents,
            status: row.status,
            paidAt: row.paid_at,
            refundedAt: row.refunded_at,
            refundReason: row.refund_reason,
            installments: row.installments,
            cardBrand: row.card_brand,
            cardLastDigits: row.card_last_digits,
            boletoUrl: row.boleto_url,
            boletoBarcode: row.boleto_barcode,
            pixQrCode: row.pix_qr_code,
            pixQrCodeUrl: row.pix_qr_code_url,
            metadata: row.metadata || {},
            providerResponse: row.provider_response || {},
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        });
    }
}

export default PostgresPaymentRepository;
