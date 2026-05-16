/**
 * Interface do Repositório de Notificações
 */

export class NotificationRepository {
    /**
     * Cria uma notificação
     */
    async create(notification) {
        throw new Error('Método create() deve ser implementado');
    }

    /**
     * Busca notificação por ID
     */
    async findById(id) {
        throw new Error('Método findById() deve ser implementado');
    }

    /**
     * Lista notificações do usuário
     */
    async findByUser(userId, filters = {}, page = 1, limit = 20) {
        throw new Error('Método findByUser() deve ser implementado');
    }

    /**
     * Marca notificação como lida
     */
    async markAsRead(id) {
        throw new Error('Método markAsRead() deve ser implementado');
    }

    /**
     * Marca todas como lidas
     */
    async markAllAsRead(userId) {
        throw new Error('Método markAllAsRead() deve ser implementado');
    }

    /**
     * Conta notificações não lidas
     */
    async countUnread(userId) {
        throw new Error('Método countUnread() deve ser implementado');
    }

    /**
     * Deleta notificação
     */
    async delete(id) {
        throw new Error('Método delete() deve ser implementado');
    }
}

export default NotificationRepository;
