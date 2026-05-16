import cron from 'node-cron';
import { ReleaseCommissionsJob } from './ReleaseCommissionsJob.js';

/**
 * Inicializa e agenda todos os jobs
 */
export const initializeJobs = (dependencies) => {
    console.log('');
    console.log('⚙️  ============================================');
    console.log('⚙️  Inicializando Jobs Agendados');
    console.log('⚙️  ============================================');

    const {
        commissionRepository,
        emailService,
    } = dependencies;

    // Job: Liberar Comissões
    const releaseCommissionsJob = new ReleaseCommissionsJob(
        commissionRepository,
        emailService
    );
    releaseCommissionsJob.schedule(cron);

    // Adicionar mais jobs aqui conforme necessário
    // const anotherJob = new AnotherJob(dependencies);
    // anotherJob.schedule(cron);

    console.log('⚙️  ============================================');
    console.log('✅ Jobs agendados com sucesso');
    console.log('⚙️  ============================================');
    console.log('');

    return {
        releaseCommissionsJob,
        // Retornar outros jobs aqui
    };
};

export default initializeJobs;
