import express from 'express';
import { query, param } from 'express-validator';
import { catchAsync } from '../../../shared/middleware/errorHandler.js';
import { authenticate, authorize } from '../../../shared/middleware/auth.js';

/**
 * Rotas HTTP do módulo de afiliados
 */
export const createAffiliateRoutes = (dependencies) => {
    const router = express.Router();
    const {
        generateAffiliateLink,
        getAffiliateLinks,
        getAffiliateDashboard,
        trackClick,
        getProductAffiliates,
    } = dependencies;

    /**
     * GET /api/affiliates/dashboard
     * Dashboard do afiliado com estatísticas
     */
    router.get(
        '/dashboard',
        authenticate,
        authorize('affiliate', 'seller', 'admin'),
        catchAsync(async (req, res) => {
            const dashboard = await getAffiliateDashboard.execute(req.user.id);

            res.json({
                status: 'success',
                data: dashboard,
            });
        })
    );

    /**
     * GET /api/affiliates/links
     * Lista links do afiliado autenticado
     */
    router.get(
        '/links',
        authenticate,
        authorize('affiliate', 'seller', 'admin'),
        [
            query('page').optional().isInt({ min: 1 }).toInt(),
            query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        ],
        catchAsync(async (req, res) => {
            const { page = 1, limit = 20 } = req.query;

            const result = await getAffiliateLinks.execute(
                req.user.id,
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
     * POST /api/affiliates/generate/:productId
     * Gera link de afiliado para um produto
     */
    router.post(
        '/generate/:productId',
        authenticate,
        authorize('affiliate', 'seller', 'admin'),
        [param('productId').isUUID()],
        catchAsync(async (req, res) => {
            const link = await generateAffiliateLink.execute(
                req.user.id,
                req.params.productId
            );

            // Gera URL completa
            const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const fullUrl = link.getFullUrl(baseUrl);

            res.status(201).json({
                status: 'success',
                message: 'Link de afiliado gerado com sucesso',
                data: {
                    link: link.toJSON(),
                    url: fullUrl,
                },
            });
        })
    );

    /**
     * GET /api/affiliates/track/:code
     * Rastreia clique em link de afiliado
     * Endpoint público (não requer autenticação)
     */
    router.get(
        '/track/:code',
        [param('code').isString().isLength({ min: 8, max: 20 })],
        catchAsync(async (req, res) => {
            const result = await trackClick.execute(req.params.code);

            res.json({
                status: 'success',
                data: result,
            });
        })
    );

    /**
     * GET /api/affiliates/product/:productId
     * Lista afiliados de um produto (apenas para o vendedor)
     */
    router.get(
        '/product/:productId',
        authenticate,
        authorize('seller', 'admin'),
        [
            param('productId').isUUID(),
            query('page').optional().isInt({ min: 1 }).toInt(),
            query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        ],
        catchAsync(async (req, res) => {
            const { page = 1, limit = 20 } = req.query;

            const result = await getProductAffiliates.execute(
                req.params.productId,
                req.user.id,
                parseInt(page),
                parseInt(limit)
            );

            res.json({
                status: 'success',
                data: result,
            });
        })
    );

    return router;
};

export default createAffiliateRoutes;
