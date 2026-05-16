/**
 * Interface (porta) do repositório de usuários
 * Define o contrato que qualquer implementação deve seguir
 * Isso permite trocar a implementação (PostgreSQL, MongoDB, etc) sem afetar o domínio
 */
export class UserRepository {
    /**
     * Cria um novo usuário
     * @param {Object} userData - Dados do usuário
     * @returns {Promise<User>}
     */
    async create(userData) {
        throw new Error('Método create() não implementado');
    }

    /**
     * Busca usuário por ID
     * @param {string} id - UUID do usuário
     * @returns {Promise<User|null>}
     */
    async findById(id) {
        throw new Error('Método findById() não implementado');
    }

    /**
     * Busca usuário por e-mail
     * @param {string} email - E-mail do usuário
     * @returns {Promise<User|null>}
     */
    async findByEmail(email) {
        throw new Error('Método findByEmail() não implementado');
    }

    /**
     * Busca usuário por código de referência
     * @param {string} referralCode - Código de referência
     * @returns {Promise<User|null>}
     */
    async findByReferralCode(referralCode) {
        throw new Error('Método findByReferralCode() não implementado');
    }

    /**
     * Busca usuário por CPF/CNPJ
     * @param {string} cpfCnpj - CPF ou CNPJ
     * @returns {Promise<User|null>}
     */
    async findByCpfCnpj(cpfCnpj) {
        throw new Error('Método findByCpfCnpj() não implementado');
    }

    /**
     * Atualiza dados do usuário
     * @param {string} id - UUID do usuário
     * @param {Object} userData - Dados a serem atualizados
     * @returns {Promise<User>}
     */
    async update(id, userData) {
        throw new Error('Método update() não implementado');
    }

    /**
     * Atualiza último login
     * @param {string} id - UUID do usuário
     * @returns {Promise<void>}
     */
    async updateLastLogin(id) {
        throw new Error('Método updateLastLogin() não implementado');
    }

    /**
     * Lista usuários com paginação
     * @param {Object} filters - Filtros de busca
     * @param {number} page - Página atual
     * @param {number} limit - Itens por página
     * @returns {Promise<{users: User[], total: number}>}
     */
    async list(filters, page, limit) {
        throw new Error('Método list() não implementado');
    }

    /**
     * Deleta usuário (soft delete)
     * @param {string} id - UUID do usuário
     * @returns {Promise<void>}
     */
    async delete(id) {
        throw new Error('Método delete() não implementado');
    }

    /**
     * Busca a cadeia de indicação de um usuário
     * @param {string} userId - UUID do usuário
     * @param {number} maxLevels - Número máximo de níveis
     * @returns {Promise<User[]>} Array de usuários na cadeia (do mais próximo ao mais distante)
     */
    async getReferralChain(userId, maxLevels = 5) {
        throw new Error('Método getReferralChain() não implementado');
    }
}

export default UserRepository;
