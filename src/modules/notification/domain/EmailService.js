/**
 * Interface do Serviço de Email (Port)
 * Define o contrato para envio de emails
 */

export class EmailService {
    /**
     * Envia email
     */
    async send(to, subject, html, text = null) {
        throw new Error('Método send() deve ser implementado');
    }

    /**
     * Envia email com template
     */
    async sendTemplate(to, templateName, data) {
        throw new Error('Método sendTemplate() deve ser implementado');
    }

    /**
     * Verifica se serviço está configurado
     */
    isConfigured() {
        throw new Error('Método isConfigured() deve ser implementado');
    }
}

export default EmailService;
