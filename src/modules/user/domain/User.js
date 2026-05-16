/**
 * Entidade User - Domínio puro (sem dependências externas)
 * Representa um usuário do sistema (vendedor, afiliado, comprador ou admin)
 */
export class User {
    constructor({
        id,
        email,
        phone,
        passwordHash,
        fullName,
        cpfCnpj,
        role = 'buyer',
        status = 'pending',
        avatarUrl,
        bio,
        bankAccount,
        referralCode,
        referredBy,
        emailVerified = false,
        createdAt,
        updatedAt,
        lastLoginAt,
        metadata = {},
    }) {
        this.id = id;
        this.email = email;
        this.phone = phone;
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.cpfCnpj = cpfCnpj;
        this.role = role;
        this.status = status;
        this.avatarUrl = avatarUrl;
        this.bio = bio;
        this.bankAccount = bankAccount;
        this.referralCode = referralCode;
        this.referredBy = referredBy;
        this.emailVerified = emailVerified;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.lastLoginAt = lastLoginAt;
        this.metadata = metadata;
    }

    /**
     * Verifica se o usuário pode sacar dinheiro
     */
    canWithdraw() {
        return (
            this.status === 'active' &&
            this.cpfCnpj &&
            this.bankAccount &&
            this.emailVerified
        );
    }

    /**
     * Verifica se o usuário pode vender produtos
     * TODOS os usuários podem vender (exceto buyers que não se cadastraram para isso)
     */
    canSell() {
        return (
            this.status === 'active' &&
            (this.role === 'seller' || this.role === 'affiliate' || this.role === 'admin')
        );
    }

    /**
     * Verifica se o usuário pode ser afiliado
     * TODOS os usuários podem ser afiliados (exceto buyers)
     */
    canAffiliate() {
        return (
            this.status === 'active' &&
            (this.role === 'affiliate' || this.role === 'seller' || this.role === 'admin')
        );
    }

    /**
     * Verifica se o usuário é admin
     */
    isAdmin() {
        return this.role === 'admin';
    }

    /**
     * Retorna dados públicos do usuário (sem informações sensíveis)
     */
    toPublic() {
        return {
            id: this.id,
            fullName: this.fullName,
            avatarUrl: this.avatarUrl,
            bio: this.bio,
            role: this.role,
        };
    }

    /**
     * Retorna dados completos do usuário (exceto senha)
     */
    toJSON() {
        return {
            id: this.id,
            email: this.email,
            phone: this.phone,
            fullName: this.fullName,
            cpfCnpj: this.cpfCnpj,
            role: this.role,
            status: this.status,
            avatarUrl: this.avatarUrl,
            bio: this.bio,
            bankAccount: this.bankAccount,
            referralCode: this.referralCode,
            referredBy: this.referredBy,
            emailVerified: this.emailVerified,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            lastLoginAt: this.lastLoginAt,
            metadata: this.metadata,
        };
    }
}

export default User;
