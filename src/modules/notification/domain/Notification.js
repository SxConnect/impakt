/**
 * Entidade Notification (Notificação)
 * Representa uma notificação no sistema
 */

export class Notification {
    constructor({
        id,
        userId,
        type, // 'email', 'in_app', 'sms'
        category, // 'order', 'payment', 'commission', 'system'
        title,
        message,
        data = {},
        read = false,
        readAt = null,
        sentAt = null,
        createdAt = new Date(),
    }) {
        this.id = id;
        this.userId = userId;
        this.type = type;
        this.category = category;
        this.title = title;
        this.message = message;
        this.data = data;
        this.read = read;
        this.readAt = readAt;
        this.sentAt = sentAt;
        this.createdAt = createdAt;

        this.validate();
    }

    validate() {
        if (!this.userId) {
            throw new Error('User ID é obrigatório');
        }

        if (!this.type) {
            throw new Error('Tipo é obrigatório');
        }

        const validTypes = ['email', 'in_app', 'sms'];
        if (!validTypes.includes(this.type)) {
            throw new Error(`Tipo inválido: ${this.type}`);
        }

        if (!this.category) {
            throw new Error('Categoria é obrigatória');
        }

        const validCategories = ['order', 'payment', 'commission', 'system'];
        if (!validCategories.includes(this.category)) {
            throw new Error(`Categoria inválida: ${this.category}`);
        }

        if (!this.title) {
            throw new Error('Título é obrigatório');
        }

        if (!this.message) {
            throw new Error('Mensagem é obrigatória');
        }
    }

    /**
     * Marca notificação como lida
     */
    markAsRead() {
        this.read = true;
        this.readAt = new Date();
    }

    /**
     * Marca notificação como enviada
     */
    markAsSent() {
        this.sentAt = new Date();
    }

    /**
     * Verifica se foi lida
     */
    isRead() {
        return this.read;
    }

    /**
     * Verifica se foi enviada
     */
    isSent() {
        return this.sentAt !== null;
    }

    /**
     * Converte para objeto simples
     */
    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            type: this.type,
            category: this.category,
            title: this.title,
            message: this.message,
            data: this.data,
            read: this.read,
            readAt: this.readAt,
            sentAt: this.sentAt,
            createdAt: this.createdAt,
        };
    }
}

export default Notification;
