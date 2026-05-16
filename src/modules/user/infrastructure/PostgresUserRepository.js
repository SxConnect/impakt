import { query } from '../../../shared/database/postgres.js';
import { UserRepository } from '../domain/UserRepository.js';
import { User } from '../domain/User.js';

/**
 * Implementação PostgreSQL do repositório de usuários
 * Adaptador de saída - converte entre o domínio e o banco de dados
 */
export class PostgresUserRepository extends UserRepository {
    /**
     * Converte linha do banco para entidade User
     */
    _toEntity(row) {
        if (!row) return null;

        return new User({
            id: row.id,
            email: row.email,
            phone: row.phone,
            passwordHash: row.password_hash,
            fullName: row.full_name,
            cpfCnpj: row.cpf_cnpj,
            role: row.role,
            status: row.status,
            avatarUrl: row.avatar_url,
            bio: row.bio,
            bankAccount: row.bank_account,
            referralCode: row.referral_code,
            referredBy: row.referred_by,
            emailVerified: row.email_verified,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            lastLoginAt: row.last_login_at,
            metadata: row.metadata,
        });
    }

    async create(userData) {
        const sql = `
      INSERT INTO users (
        email, phone, password_hash, full_name, cpf_cnpj,
        role, status, avatar_url, bio, bank_account,
        referral_code, referred_by, email_verified, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

        const values = [
            userData.email,
            userData.phone || null,
            userData.passwordHash,
            userData.fullName,
            userData.cpfCnpj || null,
            userData.role || 'buyer',
            userData.status || 'pending',
            userData.avatarUrl || null,
            userData.bio || null,
            userData.bankAccount ? JSON.stringify(userData.bankAccount) : null,
            userData.referralCode || null,
            userData.referredBy || null,
            userData.emailVerified || false,
            userData.metadata ? JSON.stringify(userData.metadata) : '{}',
        ];

        const result = await query(sql, values);
        return this._toEntity(result.rows[0]);
    }

    async findById(id) {
        const sql = 'SELECT * FROM users WHERE id = $1';
        const result = await query(sql, [id]);
        return this._toEntity(result.rows[0]);
    }

    async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = $1';
        const result = await query(sql, [email]);
        return this._toEntity(result.rows[0]);
    }

    async findByReferralCode(referralCode) {
        const sql = 'SELECT * FROM users WHERE referral_code = $1';
        const result = await query(sql, [referralCode]);
        return this._toEntity(result.rows[0]);
    }

    async findByCpfCnpj(cpfCnpj) {
        const sql = 'SELECT * FROM users WHERE cpf_cnpj = $1';
        const result = await query(sql, [cpfCnpj]);
        return this._toEntity(result.rows[0]);
    }

    async update(id, userData) {
        const fields = [];
        const values = [];
        let paramCount = 1;

        // Constrói dinamicamente a query baseado nos campos fornecidos
        if (userData.email !== undefined) {
            fields.push(`email = $${paramCount++}`);
            values.push(userData.email);
        }
        if (userData.phone !== undefined) {
            fields.push(`phone = $${paramCount++}`);
            values.push(userData.phone);
        }
        if (userData.passwordHash !== undefined) {
            fields.push(`password_hash = $${paramCount++}`);
            values.push(userData.passwordHash);
        }
        if (userData.fullName !== undefined) {
            fields.push(`full_name = $${paramCount++}`);
            values.push(userData.fullName);
        }
        if (userData.cpfCnpj !== undefined) {
            fields.push(`cpf_cnpj = $${paramCount++}`);
            values.push(userData.cpfCnpj);
        }
        if (userData.role !== undefined) {
            fields.push(`role = $${paramCount++}`);
            values.push(userData.role);
        }
        if (userData.status !== undefined) {
            fields.push(`status = $${paramCount++}`);
            values.push(userData.status);
        }
        if (userData.avatarUrl !== undefined) {
            fields.push(`avatar_url = $${paramCount++}`);
            values.push(userData.avatarUrl);
        }
        if (userData.bio !== undefined) {
            fields.push(`bio = $${paramCount++}`);
            values.push(userData.bio);
        }
        if (userData.bankAccount !== undefined) {
            fields.push(`bank_account = $${paramCount++}`);
            values.push(JSON.stringify(userData.bankAccount));
        }
        if (userData.emailVerified !== undefined) {
            fields.push(`email_verified = $${paramCount++}`);
            values.push(userData.emailVerified);
        }
        if (userData.metadata !== undefined) {
            fields.push(`metadata = $${paramCount++}`);
            values.push(JSON.stringify(userData.metadata));
        }

        if (fields.length === 0) {
            return this.findById(id);
        }

        values.push(id);
        const sql = `
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `;

        const result = await query(sql, values);
        return this._toEntity(result.rows[0]);
    }

    async updateLastLogin(id) {
        const sql = 'UPDATE users SET last_login_at = NOW() WHERE id = $1';
        await query(sql, [id]);
    }

    async list(filters = {}, page = 1, limit = 20) {
        const conditions = [];
        const values = [];
        let paramCount = 1;

        if (filters.role) {
            conditions.push(`role = $${paramCount++}`);
            values.push(filters.role);
        }
        if (filters.status) {
            conditions.push(`status = $${paramCount++}`);
            values.push(filters.status);
        }
        if (filters.search) {
            conditions.push(`(full_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
            values.push(`%${filters.search}%`);
            paramCount++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (page - 1) * limit;

        // Query de contagem
        const countSql = `SELECT COUNT(*) FROM users ${whereClause}`;
        const countResult = await query(countSql, values);
        const total = parseInt(countResult.rows[0].count);

        // Query de dados
        const dataSql = `
      SELECT * FROM users 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
        const dataResult = await query(dataSql, [...values, limit, offset]);

        return {
            users: dataResult.rows.map(row => this._toEntity(row)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async delete(id) {
        // Soft delete - apenas marca como deletado
        const sql = 'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2';
        await query(sql, ['banned', id]);
    }

    async getReferralChain(userId, maxLevels = 5) {
        // Query recursiva para buscar a cadeia de indicação
        const sql = `
      WITH RECURSIVE referral_chain AS (
        -- Caso base: usuário que indicou diretamente
        SELECT 
          u.*, 
          1 as level
        FROM users u
        WHERE u.id = (SELECT referred_by FROM users WHERE id = $1)
        
        UNION ALL
        
        -- Caso recursivo: sobe na cadeia
        SELECT 
          u.*, 
          rc.level + 1
        FROM users u
        INNER JOIN referral_chain rc ON u.id = rc.referred_by
        WHERE rc.level < $2
      )
      SELECT * FROM referral_chain
      ORDER BY level ASC
    `;

        const result = await query(sql, [userId, maxLevels]);
        return result.rows.map(row => this._toEntity(row));
    }
}

export default PostgresUserRepository;
