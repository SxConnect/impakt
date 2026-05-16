import express from 'express';
import { query } from 'express-validator';
import { catchAsync } from '../../../shared/middleware/errorHandler.js';
import { authenticate, authorize } from '../../../shared/middleware/auth.js';

/**
 * Rotas HTTP do módulo de comissões
 */
export const createCommissionRoutes = (dependencies) => {
    const router = express.Router();
    const {
        getCommissions,
        getCommissionSummary,
        getCommissionsByPeriod,
    } = dependencies;

    /**
     * GET /api/commissions
     * Lista comissões do afiliado autenticado
     */
    router.get(
        '/',
        authenticate,
        authorize('affiliate', 'seller', 'admin'),
        [
            query('page').optional().isInt({ min: 1 }).toInt(),
            query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
            query('status').optional().isIn(['pending', 'held', 'released', 'cancelled']),
            query('productId').optional().isUUID(),
        ],
        catchAsync(async (req, res) => {
            const { page = 1, limit = 20, status, productId } = req.query;

            const result = await getCommissions.execute(
                req.user.id,
                { status, productId },
                parseInt(page),
                parseInt(limit)
            );

            res.json({
                status: 'success',
                data: result,
            });
        })
    );

    /**
     * GET /api/commissions/summary
     * Resumo de comissões do afiliado
     */
    router.get(
        '/summary',
        authenticate,
        authorize('affiliate', 'seller', 'admin'),
        catchAsync(async (req, res) => {
            const summary = await getCommissionSummary.execute(req.user.id);

            res.json({
                status: 'success',
                data: summary,
            });
        })
    );

    /**
     * GET /api/commissions/period
     * Comissões por período (para gráficos)
     */
    router.get(
        '/period',
        authenticate,
        authorize('affiliate', 'seller', 'admin'),
        [
            query('startDate').isISO8601().withMessage('Data inicial inválida'),
            query('endDate').isISO8601().withMessage('Data final inválida'),
        ],
        catchAsync(async (req, res) => {
            const { startDate, endDate } = req.query;

            const data = await getCommissionsByPeriod.execute(
                req.user.id,
                startDate,
                endDate
            );

            res.json({
                status: 'success',
                data,
            });
        })
    );

    return router;
};

export default createCommissionRoutes;
