import express from 'express';
import { body, param, query } from 'express-validator';
import { catchAsync } from '../../../shared/middleware/errorHandler.js';
import { authenticate, authorize } from '../../../shared/middleware/auth.js';
import { validate } from '../../../shared/middleware/validate.js';

/**
 * Rotas HTTP do módulo de pagamentos
 */
export const createPaymentRoutes = (dependencies) => {
    const router = express.Router();
    const {
        processPayment,
        handleWebhook,
        getPayment,
        refundPayment,
    } = dependencies;

    /**
     * POST /api/payments
     * Processa um pagamento
     */
    router.post(
        '/',
        authenticate,
        [
            body('orderId').isUUID().withMessage('Order ID inválido'),
            body('provider')
                .isIn(['pagarme', 'stripe', 'asaas'])
                .withMessage('Provider deve ser pagarme, stripe ou asaas'),
            body('method')
                .isIn(['credit_card', 'boleto', 'pix', 'debit_card'])
                .withMessage('Método de pagamento inválido'),
            body('paymentData').isObject().withMessage('Payment data é obrigatório'),
        ],
        validate,
        catchAsync(async (req, res) => {
            const { orderId, provider, method, paymentData } = req.body;

            const payment = await processPayment.execute({
                orderId,
                provider,
                method,
                paymentData,
            });

            res.status(201).json({
                status: 'success',
                data: payment,
            });
        })
    );

    /**
     * GET /api/payments/:id
     * Obtém detalhes de um pagamento
     */
    router.get(
        '/:id',
        authenticate,
        [
            param('id').isUUID().withMessage('Payment ID inválido'),
        ],
        validate,
        catchAsync(async (req, res) => {
            const payment = await getPayment.execute(
                req.params.id,
                req.user.id,
                req.user.role
            );

            res.json({
                status: 'success',
                data: payment,
            });
        })
    );

    /**
     * POST /api/payments/:id/refund
     * Reembolsa um pagamento
     */
    router.post(
        '/:id/refund',
        authenticate,
        authorize('admin', 'seller'),
        [
            param('id').isUUID().withMessage('Payment ID inválido'),
            body('reason').isString().notEmpty().withMessage('Motivo é obrigatório'),
        ],
        validate,
        catchAsync(async (req, res) => {
            const { reason } = req.body;

            const payment = await refundPayment.execute(
                req.params.id,
                reason,
                req.user.id,
                req.user.role
            );

            res.json({
                status: 'success',
                data: payment,
            });
        })
    );

    /**
     * POST /api/payments/webhook/:provider
     * Webhook para receber notificações dos gateways
     * Público (sem autenticação)
     */
    router.post(
        '/webhook/:provider',
        [
            param('provider')
                .isIn(['pagarme', 'stripe', 'asaas'])
                .withMessage('Provider inválido'),
        ],
        validate,
        catchAsync(async (req, res) => {
            const { provider } = req.params;
            const payload = req.body;
            const signature = req.headers['x-hub-signature'] ||
                req.headers['stripe-signature'] ||
                req.headers['asaas-access-token'];

            const result = await handleWebhook.execute(
                provider,
                payload,
                signature
            );

            res.json({
                status: 'success',
                data: result,
            });
        })
    );

    return router;
};

export default createPaymentRoutes;
