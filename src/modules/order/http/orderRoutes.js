import express from 'express';
import { body, query, param } from 'express-validator';
import { catchAsync } from '../../../shared/middleware/errorHandler.js';
import { authenticate, authorize } from '../../../shared/middleware/auth.js';
import { validate } from '../../../shared/middleware/validate.js';

/**
 * Rotas HTTP do módulo de pedidos
 */
export const createOrderRoutes = (dependencies) => {
    const router = express.Router();
    const {
        createOrder,
        getOrder,
        listOrders,
        confirmPayment,
        cancelOrder,
        getOrderStats,
    } = dependencies;

    /**
     * POST /api/orders
     * Cria um novo pedido
     */
    router.post(
        '/',
        authenticate,
        [
            body('productId').isUUID().withMessage('Product ID inválido'),
            body('quantity').optional().isInt({ min: 1 }).withMessage('Quantidade deve ser maior que zero'),
            body('affiliateLinkCode').optional().isString().isLength({ min: 8, max: 8 }),
            body('metadata').optional().isObject(),
        ],
        validate,
        catchAsync(async (req, res) => {
            const { productId, quantity, affiliateLinkCode, metadata } = req.body;

            const result = await createOrder.execute({
                productId,
                buyerId: req.user.id,
                quantity,
                affiliateLinkCode,
                metadata,
            });

            res.status(201).json({
                status: 'success',
                data: result,
            });
        })
    );

    /**
     * GET /api/orders/:id
     * Obtém detalhes de um pedido
     */
    router.get(
        '/:id',
        authenticate,
        [
            param('id').isUUID().withMessage('Order ID inválido'),
        ],
        validate,
        catchAsync(async (req, res) => {
            const order = await getOrder.execute(
                req.params.id,
                req.user.id,
                req.user.role
            );

            res.json({
                status: 'success',
                data: order,
            });
        })
    );

    /**
     * GET /api/orders
     * Lista pedidos do usuário
     */
    router.get(
        '/',
        authenticate,
        [
            query('type').optional().isIn(['buyer', 'seller']).withMessage('Tipo deve ser buyer ou seller'),
            query('status').optional().isIn(['pending', 'paid', 'completed', 'cancelled', 'refunded']),
            query('productId').optional().isUUID(),
            query('page').optional().isInt({ min: 1 }).toInt(),
            query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        ],
        validate,
        catchAsync(async (req, res) => {
            const {
                type = 'buyer',
                status,
                productId,
                page = 1,
                limit = 20,
            } = req.query;

            const filters = {};
            if (status) filters.status = status;
            if (productId) filters.productId = productId;

            const result = await listOrders.execute(
                req.user.id,
                req.user.role,
                type,
                filters,
                parseInt(page),
                parseInt(limit)
            );

            res.json({
                status: 'success',
                data: {
                    orders: result.orders,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: result.total,
                        totalPages: Math.ceil(result.total / limit),
                    },
                },
            });
        })
    );

    /**
     * POST /api/orders/:id/confirm-payment
     * Confirma pagamento de um pedido (webhook ou admin)
     */
    router.post(
        '/:id/confirm-payment',
        authenticate,
        authorize('admin'),
        [
            param('id').isUUID().withMessage('Order ID inválido'),
            body('paymentId').isString().notEmpty().withMessage('Payment ID é obrigatório'),
            body('paymentMethod').isString().notEmpty().withMessage('Payment method é obrigatório'),
        ],
        validate,
        catchAsync(async (req, res) => {
            const { paymentId, paymentMethod } = req.body;

            const order = await confirmPayment.execute(
                req.params.id,
                paymentId,
                paymentMethod
            );

            res.json({
                status: 'success',
                data: order,
            });
        })
    );

    /**
     * POST /api/orders/:id/cancel
     * Cancela um pedido
     */
    router.post(
        '/:id/cancel',
        authenticate,
        [
            param('id').isUUID().withMessage('Order ID inválido'),
            body('reason').isString().notEmpty().withMessage('Motivo é obrigatório'),
        ],
        validate,
        catchAsync(async (req, res) => {
            const { reason } = req.body;

            const order = await cancelOrder.execute(
                req.params.id,
                req.user.id,
                req.user.role,
                reason
            );

            res.json({
                status: 'success',
                data: order,
            });
        })
    );

    /**
     * GET /api/orders/stats/:type
     * Obtém estatísticas de pedidos
     */
    router.get(
        '/stats/:type',
        authenticate,
        [
            param('type').isIn(['seller', 'buyer']).withMessage('Tipo deve ser seller ou buyer'),
        ],
        validate,
        catchAsync(async (req, res) => {
            const stats = await getOrderStats.execute(
                req.user.id,
                req.params.type
            );

            res.json({
                status: 'success',
                data: stats,
            });
        })
    );

    return router;
};

export default createOrderRoutes;
