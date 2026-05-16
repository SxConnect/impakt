/**
 * Serviço de WhatsApp
 * Integração para envio de mensagens via WhatsApp
 * 
 * Suporta múltiplas estratégias:
 * - WhatsApp Business API (oficial)
 * - Integração com SXConnect
 * - Notificação manual para admin
 */

export class WhatsAppService {
    constructor(config = {}) {
        this.provider = config.provider || process.env.WHATSAPP_PROVIDER || 'manual';
        this.apiUrl = config.apiUrl || process.env.WHATSAPP_API_URL;
        this.apiKey = config.apiKey || process.env.WHATSAPP_API_KEY;
        this.adminPhone = config.adminPhone || process.env.ADMIN_WHATSAPP;
    }

    /**
     * Envia mensagem de boas-vindas com link de ativação
     */
    async sendWelcomeMessage({ phone, name, activationLink }) {
        const message = this._buildWelcomeMessage(name, activationLink);

        switch (this.provider) {
            case 'whatsapp-business':
                return await this._sendViaWhatsAppBusiness(phone, message);

            case 'sxconnect':
                return await this._sendViaSXConnect(phone, message, name);

            case 'manual':
            default:
                return await this._sendManualNotification(phone, name, activationLink);
        }
    }

    /**
     * Envia notificação de nova comissão
     */
    async sendCommissionNotification({ phone, name, amount, productName }) {
        const message = `🎉 *Nova Comissão Recebida!*

Olá ${name}!

Você recebeu uma nova comissão de *R$ ${(amount / 100).toFixed(2)}* pela venda de:
📦 ${productName}

A comissão será liberada após o período de escrow de 7 dias.

Acesse seu dashboard para mais detalhes:
${process.env.APP_URL}/dashboard

Equipe IMPAKT`;

        return await this._send(phone, message);
    }

    /**
     * Envia notificação de comissão liberada
     */
    async sendCommissionReleasedNotification({ phone, name, amount }) {
        const message = `💰 *Comissão Liberada!*

Olá ${name}!

Sua comissão de *R$ ${(amount / 100).toFixed(2)}* foi liberada e está disponível para saque!

Acesse seu dashboard para solicitar o saque:
${process.env.APP_URL}/dashboard/withdrawals

Equipe IMPAKT`;

        return await this._send(phone, message);
    }

    /**
     * Envia notificação de nova venda
     */
    async sendSaleNotification({ phone, name, productName, amount }) {
        const message = `🎯 *Nova Venda Realizada!*

Olá ${name}!

Parabéns! Você realizou uma nova venda:
📦 ${productName}
💵 R$ ${(amount / 100).toFixed(2)}

Acesse seu dashboard para mais detalhes:
${process.env.APP_URL}/dashboard

Equipe IMPAKT`;

        return await this._send(phone, message);
    }

    // ===================================
    // Métodos Privados - Providers
    // ===================================

    /**
     * Envia via WhatsApp Business API (oficial)
     */
    async _sendViaWhatsAppBusiness(phone, message) {
        try {
            const cleanPhone = this._cleanPhone(phone);

            const response = await fetch(`${this.apiUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: cleanPhone,
                    type: 'text',
                    text: {
                        body: message
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`WhatsApp API error: ${response.statusText}`);
            }

            const result = await response.json();

            return {
                success: true,
                provider: 'whatsapp-business',
                messageId: result.messages?.[0]?.id,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Erro ao enviar via WhatsApp Business:', error);

            // Fallback para notificação manual
            return await this._sendManualNotification(phone, 'Usuário', message);
        }
    }

    /**
     * Envia via SXConnect
     */
    async _sendViaSXConnect(phone, message, name) {
        try {
            const cleanPhone = this._cleanPhone(phone);

            const response = await fetch(`${this.apiUrl}/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: cleanPhone,
                    message: message,
                    name: name
                })
            });

            if (!response.ok) {
                throw new Error(`SXConnect API error: ${response.statusText}`);
            }

            const result = await response.json();

            return {
                success: true,
                provider: 'sxconnect',
                messageId: result.id,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Erro ao enviar via SXConnect:', error);

            // Fallback para notificação manual
            return await this._sendManualNotification(phone, name, message);
        }
    }

    /**
     * Envia notificação manual para admin
     * (usado como fallback ou quando não há integração configurada)
     */
    async _sendManualNotification(phone, name, content) {
        console.log('='.repeat(60));
        console.log('📱 NOTIFICAÇÃO MANUAL - WHATSAPP');
        console.log('='.repeat(60));
        console.log(`Para: ${phone}`);
        console.log(`Nome: ${name}`);
        console.log(`Mensagem:\n${content}`);
        console.log('='.repeat(60));
        console.log(`⚠️  Envie esta mensagem manualmente para o WhatsApp do usuário`);
        console.log('='.repeat(60));

        // Aqui você pode implementar:
        // - Salvar em fila de mensagens pendentes
        // - Enviar email para admin
        // - Notificar via Slack/Discord
        // - Salvar em banco de dados

        return {
            success: true,
            provider: 'manual',
            requiresManualAction: true,
            phone: phone,
            message: content,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Método genérico de envio (usa o provider configurado)
     */
    async _send(phone, message) {
        switch (this.provider) {
            case 'whatsapp-business':
                return await this._sendViaWhatsAppBusiness(phone, message);

            case 'sxconnect':
                return await this._sendViaSXConnect(phone, 'Usuário', message);

            case 'manual':
            default:
                return await this._sendManualNotification(phone, 'Usuário', message);
        }
    }

    // ===================================
    // Métodos Auxiliares
    // ===================================

    /**
     * Constrói mensagem de boas-vindas
     */
    _buildWelcomeMessage(name, activationLink) {
        return `🎉 *Bem-vindo ao IMPAKT!*

Olá ${name}!

Seu cadastro foi realizado com sucesso! 

Para ativar sua conta e começar a usar o sistema, clique no link abaixo:

${activationLink}

Este link é válido por 24 horas.

Após ativar sua conta, você poderá:
✅ Vender seus produtos
✅ Criar links de afiliado
✅ Acompanhar suas comissões
✅ Gerenciar seus ganhos

Qualquer dúvida, estamos à disposição!

Equipe IMPAKT
${process.env.APP_URL}`;
    }

    /**
     * Limpa número de telefone (remove caracteres especiais)
     */
    _cleanPhone(phone) {
        if (!phone) return '';

        // Remove tudo exceto números
        let cleaned = phone.replace(/\D/g, '');

        // Adiciona código do país se não tiver (Brasil = 55)
        if (cleaned.length === 11 && !cleaned.startsWith('55')) {
            cleaned = '55' + cleaned;
        }

        return cleaned;
    }

    /**
     * Valida número de telefone
     */
    isValidPhone(phone) {
        const cleaned = this._cleanPhone(phone);

        // Formato brasileiro: 55 + DDD (2 dígitos) + número (8 ou 9 dígitos)
        // Total: 12 ou 13 dígitos
        return cleaned.length >= 12 && cleaned.length <= 13;
    }
}

export default WhatsAppService;
