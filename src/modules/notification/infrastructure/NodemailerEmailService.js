import nodemailer from 'nodemailer';
import { EmailService } from '../domain/EmailService.js';

/**
 * Implementação do EmailService usando Nodemailer
 */
export class NodemailerEmailService extends EmailService {
    constructor(config = {}) {
        super();
        this.config = {
            host: config.host || process.env.SMTP_HOST,
            port: config.port || parseInt(process.env.SMTP_PORT || '587'),
            secure: config.secure || process.env.SMTP_SECURE === 'true',
            auth: {
                user: config.user || process.env.SMTP_USER,
                pass: config.pass || process.env.SMTP_PASS,
            },
        };
        this.from = config.from || process.env.EMAIL_FROM || 'IMPAKT <noreply@IMPAKT.com.br>';
        this.transporter = null;

        if (this.isConfigured()) {
            this.transporter = nodemailer.createTransport(this.config);
        }
    }

    /**
     * Envia email
     */
    async send(to, subject, html, text = null) {
        if (!this.isConfigured()) {
            console.warn('Email service não configurado. Email não enviado.');
            return { success: false, reason: 'not_configured' };
        }

        try {
            const info = await this.transporter.sendMail({
                from: this.from,
                to,
                subject,
                html,
                text: text || this.stripHtml(html),
            });

            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Envia email com template
     */
    async sendTemplate(to, templateName, data) {
        const templates = {
            'order-created': {
                subject: 'Pedido Criado - IMPAKT',
                html: this.getOrderCreatedTemplate(data),
            },
            'payment-confirmed': {
                subject: 'Pagamento Confirmado - IMPAKT',
                html: this.getPaymentConfirmedTemplate(data),
            },
            'commission-earned': {
                subject: 'Nova Comissão - IMPAKT',
                html: this.getCommissionEarnedTemplate(data),
            },
            'commission-released': {
                subject: 'Comissão Liberada - IMPAKT',
                html: this.getCommissionReleasedTemplate(data),
            },
            'welcome': {
                subject: 'Bem-vindo ao IMPAKT',
                html: this.getWelcomeTemplate(data),
            },
        };

        const template = templates[templateName];
        if (!template) {
            throw new Error(`Template não encontrado: ${templateName}`);
        }

        return await this.send(to, template.subject, template.html);
    }

    /**
     * Verifica se serviço está configurado
     */
    isConfigured() {
        return !!(
            this.config.host &&
            this.config.auth.user &&
            this.config.auth.pass
        );
    }

    /**
     * Remove tags HTML
     */
    stripHtml(html) {
        return html.replace(/<[^>]*>/g, '');
    }

    /**
     * Templates de email
     */

    getOrderCreatedTemplate(data) {
        return `
            <h2>Pedido Criado com Sucesso!</h2>
            <p>Olá ${data.userName},</p>
            <p>Seu pedido <strong>#${data.orderNumber}</strong> foi criado com sucesso.</p>
            <p><strong>Produto:</strong> ${data.productName}</p>
            <p><strong>Valor:</strong> R$ ${(data.totalCents / 100).toFixed(2)}</p>
            <p><strong>Status:</strong> Aguardando pagamento</p>
            <p>Obrigado por comprar na IMPAKT!</p>
        `;
    }

    getPaymentConfirmedTemplate(data) {
        return `
            <h2>Pagamento Confirmado!</h2>
            <p>Olá ${data.userName},</p>
            <p>O pagamento do pedido <strong>#${data.orderNumber}</strong> foi confirmado.</p>
            <p><strong>Valor:</strong> R$ ${(data.totalCents / 100).toFixed(2)}</p>
            <p><strong>Método:</strong> ${data.paymentMethod}</p>
            <p>Seu pedido está sendo processado.</p>
        `;
    }

    getCommissionEarnedTemplate(data) {
        return `
            <h2>Nova Comissão Gerada!</h2>
            <p>Olá ${data.userName},</p>
            <p>Você ganhou uma nova comissão!</p>
            <p><strong>Produto:</strong> ${data.productName}</p>
            <p><strong>Valor:</strong> R$ ${(data.amountCents / 100).toFixed(2)}</p>
            <p><strong>Nível:</strong> ${data.level}</p>
            <p>A comissão será liberada em 7 dias após a confirmação do pagamento.</p>
        `;
    }

    getCommissionReleasedTemplate(data) {
        return `
            <h2>Comissão Liberada!</h2>
            <p>Olá ${data.userName},</p>
            <p>Sua comissão foi liberada e está disponível para saque!</p>
            <p><strong>Valor:</strong> R$ ${(data.amountCents / 100).toFixed(2)}</p>
            <p><strong>Total disponível:</strong> R$ ${(data.totalAvailableCents / 100).toFixed(2)}</p>
            <p>Acesse sua conta para solicitar o saque.</p>
        `;
    }

    getWelcomeTemplate(data) {
        return `
            <h2>Bem-vindo ao IMPAKT!</h2>
            <p>Olá ${data.userName},</p>
            <p>Sua conta foi criada com sucesso.</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Tipo:</strong> ${data.role}</p>
            <p>Comece agora a vender ou promover produtos na IMPAKT!</p>
        `;
    }
}

export default NodemailerEmailService;
