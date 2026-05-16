/**
 * Caso de uso: Cancelar comissões de um pedido
 * Chamado quando há devolução/estorno
 */
export class CancelCommissions {
    constructor(commissionRepository) {
        this.commissionRepository = commissionRepository;
    }

    async execute(orderId) {
        // Cancela as comissões
        await this.commissionRepository.cancelByOrder(orderId);

        return {
            message: 'Comissões canceladas com sucesso',
            orderId,
        };
    }
}

export default CancelCommissions;
