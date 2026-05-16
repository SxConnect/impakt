/**
 * Job: Liberar Comissões
 * Executa diariamente para liberar comissões após período de escrow
 */

export class ReleaseCommissionsJob {
    constructor(commissionRepository, emailService) {
        this.commissionRepository = commissionRepository;
        this.emailService = emailService;
    }

    /**
     * Executa o job
     */
    async execute() {
        console.log('🔄 [Job] Iniciando liberação de comissões...');

        try {
            // 1. Busca comissões prontas para liberar
            const commissionsToRelease = await this.findCommissionsToRelease();

            if (commissionsToRelease.length === 0) {
                console.log('✅ [Job] Nenhuma comissão para liberar');
                return {
                    success: true,
                    released: 0,
                    message: 'Nenhuma comissão para liberar',
                };
            }

            console.log(`📊 [Job] ${commissionsToRelease.length} comissões para liberar`);

            // 2. Libera comissões
            let releasedCount = 0;
            const errors = [];

            for (const commission of commissionsToRelease) {
                try {
                    await this.releaseCommission(commission);
                    releasedCount++;
                } catch (error) {
                    console.error(`❌ [Job] Erro ao liberar comissão ${commission.id}:`, error);
                    errors.push({
                        commissionId: commission.id,
                        error: error.message,
                    });
                }
            }

            console.log(`✅ [Job] ${releasedCount} comissões liberadas com sucesso`);

            if (errors.length > 0) {
                console.warn(`⚠️  [Job] ${errors.length} erros durante liberação`);
            }

            return {
                success: true,
                released: releasedCount,
                errors: errors.length,
                details: errors,
            };
        } catch (error) {
            console.error('❌ [Job] Erro ao executar job:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Busca comissões prontas para liberar
     */
    async findCommissionsToRelease() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Busca comissões com status 'held' e data de liberação <= hoje
        const query = `
            SELECT c.*, u.name as affiliate_name, u.email as affiliate_email
            FROM commissions c
            JOIN users u ON c.affiliate_id = u.id
            WHERE c.status = 'held'
                AND c.release_date <= $1
            ORDER BY c.release_date ASC
        `;

        const { pool } = await import('../shared/database/postgres.js');
        const result = await pool.query(query, [today]);

        return result.rows;
    }

    /**
     * Libera uma comissão
     */
    async releaseCommission(commission) {
        // 1. Atualiza status para 'released'
        await this.commissionRepository.updateStatus(commission.id, 'released');

        // 2. Envia notificação por email
        if (this.emailService.isConfigured()) {
            try {
                await this.emailService.sendTemplate(
                    commission.affiliate_email,
                    'commission-released',
                    {
                        userName: commission.affiliate_name,
                        amountCents: commission.amount_cents,
                        totalAvailableCents: commission.amount_cents, // TODO: calcular total disponível
                    }
                );
            } catch (error) {
                console.error('Erro ao enviar email:', error);
                // Não falha a liberação se houver erro no email
            }
        }

        console.log(`✅ Comissão ${commission.id} liberada (R$ ${commission.amount_cents / 100})`);
    }

    /**
     * Agenda execução diária
     */
    schedule(cron) {
        // Executa todo dia às 00:00
        cron.schedule('0 0 * * *', async () => {
            console.log('⏰ [Cron] Executando job de liberação de comissões...');
            await this.execute();
        });

        console.log('📅 [Cron] Job de liberação de comissões agendado (diário às 00:00)');
    }
}

export default ReleaseCommissionsJob;
