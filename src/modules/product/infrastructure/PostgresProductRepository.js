import { query } from '../../../shared/database/postgres.js';
import { ProductRepository } from '../domain/ProductRepository.js';
import { Product } from '../domain/Product.js';

/**
 * Implementação PostgreSQL do repositório de produtos
 */
export class PostgresProductRepository extends ProductRepository {
    /**
     * Converte linha do banco para entidade Product
     */
    _toEntity(row) {
        if (!row) return null;

        return new Product({
            id: row.id,
            sellerId: row.seller_id,
            categoryId: row.category_id,
            name: row.name,
            slug: row.slug,
            description: row.description,
            shortDescription: row.short_description,
            productType: row.product_type,
            status: row.status,
            priceCents: row.price_cents,
            isRecurring: row.is_recurring,
            recurringDays: row.recurring_days,
            affiliatePct: parseFloat(row.affiliate_pct),
            maxAffiliateLevels: row.max_affiliate_levels,
            levelCommission: row.level_commission || [],
            incomeDistEnabled: row.income_dist_enabled,
            incomeDistConfig: row.income_dist_config || [],
            warrantyDays: row.warranty_days,
            totalSales: row.total_sales,
            totalRevenueCents: row.total_revenue_cents,
            avgRating: row.avg_rating ? parseFloat(row.avg_rating) : null,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            publishedAt: row.published_at,
            deletedAt: row.deleted_at,
        });
    }

    async create(productData) {
        const sql = `
      INSERT INTO products (
        seller_id, category_id, name, slug, description, short_description,
        product_type, status, price_cents, is_recurring, recurring_days,
        affiliate_pct, max_affiliate_levels, level_commission,
        income_dist_enabled, income_dist_config, warranty_days
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

        const values = [
            productData.sellerId,
            productData.categoryId || null,
            productData.name,
            productData.slug,
            productData.description || null,
            productData.shortDescription || null,
            productData.productType,
            productData.status || 'draft',
            productData.priceCents,
            productData.isRecurring || false,
            productData.recurringDays || 30,
            productData.affiliatePct || 25.00,
            productData.maxAffiliateLevels || 3,
            JSON.stringify(productData.levelCommission || []),
            productData.incomeDistEnabled || false,
            JSON.stringify(productData.incomeDistConfig || []),
            productData.warrantyDays || 7,
        ];

        const result = await query(sql, values);
        return this._toEntity(result.rows[0]);
    }

    async findById(id) {
        const sql = 'SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL';
        const result = await query(sql, [id]);
        return this._toEntity(result.rows[0]);
    }

    async findBySlug(slug) {
        const sql = 'SELECT * FROM products WHERE slug = $1 AND deleted_at IS NULL';
        const result = await query(sql, [slug]);
        return this._toEntity(result.rows[0]);
    }

    async list(filters = {}, page = 1, limit = 20) {
        const conditions = ['deleted_at IS NULL'];
        const values = [];
        let paramCount = 1;

        if (filters.status) {
            conditions.push(`status = $${paramCount++}`);
            values.push(filters.status);
        }

        if (filters.productType) {
            conditions.push(`product_type = $${paramCount++}`);
            values.push(filters.productType);
        }

        if (filters.categoryId) {
            conditions.push(`category_id = $${paramCount++}`);
            values.push(filters.categoryId);
        }

        if (filters.minPrice) {
            conditions.push(`price_cents >= $${paramCount++}`);
            values.push(filters.minPrice);
        }

        if (filters.maxPrice) {
            conditions.push(`price_cents <= $${paramCount++}`);
            values.push(filters.maxPrice);
        }

        if (filters.isRecurring !== undefined) {
            conditions.push(`is_recurring = $${paramCount++}`);
            values.push(filters.isRecurring);
        }

        const whereClause = conditions.join(' AND ');
        const offset = (page - 1) * limit;

        // Query de contagem
        const countSql = `SELECT COUNT(*) FROM products WHERE ${whereClause}`;
        const countResult = await query(countSql, values);
        const total = parseInt(countResult.rows[0].count);

        // Query de dados
        const dataSql = `
      SELECT * FROM products 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
        const dataResult = await query(dataSql, [...values, limit, offset]);

        return {
            products: dataResult.rows.map(row => this._toEntity(row)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async listBySeller(sellerId, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        // Query de contagem
        const countSql = `
      SELECT COUNT(*) FROM products 
      WHERE seller_id = $1 AND deleted_at IS NULL
    `;
        const countResult = await query(countSql, [sellerId]);
        const total = parseInt(countResult.rows[0].count);

        // Query de dados
        const dataSql = `
      SELECT * FROM products 
      WHERE seller_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
        const dataResult = await query(dataSql, [sellerId, limit, offset]);

        return {
            products: dataResult.rows.map(row => this._toEntity(row)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async search(searchText, page = 1, limit = 20) {
        const offset = (page - 1) * limit;

        // Query de contagem
        const countSql = `
      SELECT COUNT(*) FROM products 
      WHERE search_vector @@ plainto_tsquery('portuguese', $1)
        AND deleted_at IS NULL
        AND status = 'active'
    `;
        const countResult = await query(countSql, [searchText]);
        const total = parseInt(countResult.rows[0].count);

        // Query de dados com ranking
        const dataSql = `
      SELECT *, 
        ts_rank(search_vector, plainto_tsquery('portuguese', $1)) as rank
      FROM products 
      WHERE search_vector @@ plainto_tsquery('portuguese', $1)
        AND deleted_at IS NULL
        AND status = 'active'
      ORDER BY rank DESC, created_at DESC
      LIMIT $2 OFFSET $3
    `;
        const dataResult = await query(dataSql, [searchText, limit, offset]);

        return {
            products: dataResult.rows.map(row => this._toEntity(row)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async update(id, productData) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        // Constrói dinamicamente a query baseado nos campos fornecidos
        if (productData.name !== undefined) {
            fields.push(`name = $${paramCount++}`);
            values.push(productData.name);
        }
        if (productData.slug !== undefined) {
            fields.push(`slug = $${paramCount++}`);
            values.push(productData.slug);
        }
        if (productData.description !== undefined) {
            fields.push(`description = $${paramCount++}`);
            values.push(productData.description);
        }
        if (productData.shortDescription !== undefined) {
            fields.push(`short_description = $${paramCount++}`);
            values.push(productData.shortDescription);
        }
        if (productData.categoryId !== undefined) {
            fields.push(`category_id = $${paramCount++}`);
            values.push(productData.categoryId);
        }
        if (productData.productType !== undefined) {
            fields.push(`product_type = $${paramCount++}`);
            values.push(productData.productType);
        }
        if (productData.status !== undefined) {
            fields.push(`status = $${paramCount++}`);
            values.push(productData.status);
        }
        if (productData.priceCents !== undefined) {
            fields.push(`price_cents = $${paramCount++}`);
            values.push(productData.priceCents);
        }
        if (productData.isRecurring !== undefined) {
            fields.push(`is_recurring = $${paramCount++}`);
            values.push(productData.isRecurring);
        }
        if (productData.recurringDays !== undefined) {
            fields.push(`recurring_days = $${paramCount++}`);
            values.push(productData.recurringDays);
        }
        if (productData.affiliatePct !== undefined) {
            fields.push(`affiliate_pct = $${paramCount++}`);
            values.push(productData.affiliatePct);
        }
        if (productData.maxAffiliateLevels !== undefined) {
            fields.push(`max_affiliate_levels = $${paramCount++}`);
            values.push(productData.maxAffiliateLevels);
        }
        if (productData.levelCommission !== undefined) {
            fields.push(`level_commission = $${paramCount++}`);
            values.push(JSON.stringify(productData.levelCommission));
        }
        if (productData.incomeDistEnabled !== undefined) {
            fields.push(`income_dist_enabled = $${paramCount++}`);
            values.push(productData.incomeDistEnabled);
        }
        if (productData.incomeDistConfig !== undefined) {
            fields.push(`income_dist_config = $${paramCount++}`);
            values.push(JSON.stringify(productData.incomeDistConfig));
        }
        if (productData.warrantyDays !== undefined) {
            fields.push(`warranty_days = $${paramCount++}`);
            values.push(productData.warrantyDays);
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        values.push(id);
        const sql = `
      UPDATE products 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING *
    `;

        const result = await query(sql, values);
        return this._toEntity(result.rows[0]);
    }

    async delete(id) {
        const sql = `
      UPDATE products 
      SET status = 'deleted', deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `;
        await query(sql, [id]);
    }

    async publish(id) {
        const sql = `
      UPDATE products 
      SET status = 'active', published_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;
        const result = await query(sql, [id]);
        return this._toEntity(result.rows[0]);
    }

    async pause(id) {
        const sql = `
      UPDATE products 
      SET status = 'paused', updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING *
    `;
        const result = await query(sql, [id]);
        return this._toEntity(result.rows[0]);
    }

    async incrementSales(id, amountCents) {
        const sql = `
      UPDATE products 
      SET 
        total_sales = total_sales + 1,
        total_revenue_cents = total_revenue_cents + $2,
        updated_at = NOW()
      WHERE id = $1
    `;
        await query(sql, [id, amountCents]);
    }
}

export default PostgresProductRepository;
