import express from 'express';
import { body, query } from 'express-validator';
import { catchAsync } from '../../../shared/middleware/errorHandler.js';
import { authenticate, authorize, optionalAuth } from '../../../shared/middleware/auth.js';

/**
 * Rotas HTTP do módulo de produtos
 */
export const createProductRoutes = (dependencies) => {
    const router = express.Router();
    const {
        createProduct,
        getProduct,
        listProducts,
        updateProduct,
        deleteProduct,
        publishProduct,
        productRepository,
    } = dependencies;

    /**
     * GET /api/products
     * Lista produtos com filtros
     */
    router.get(
        '/',
        [
            query('page').optional().isInt({ min: 1 }).toInt(),
            query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
            query('status').optional().isIn(['draft', 'active', 'paused']),
            query('productType').optional().isIn(['physical', 'digital', 'service', 'subscription']),
            query('categoryId').optional().isUUID(),
            query('minPrice').optional().isInt({ min: 0 }).toInt(),
            query('maxPrice').optional().isInt({ min: 0 }).toInt(),
            query('search').optional().isString(),
        ],
        catchAsync(async (req, res) => {
            const { page = 1, limit = 20, search, ...filters } = req.query;

            const result = await listProducts.execute(
                { ...filters, search },
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
     * GET /api/products/seller/:sellerId
     * Lista produtos de um vendedor específico
     */
    router.get(
        '/seller/:sellerId',
        [
            query('page').optional().isInt({ min: 1 }).toInt(),
            query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        ],
        catchAsync(async (req, res) => {
            const { sellerId } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const result = await productRepository.listBySeller(
                sellerId,
                parseInt(page),
                parseInt(limit)
            );

            res.json({
                status: 'success',
                data: {
                    ...result,
                    products: result.products.map(p => p.toPublic()),
                },
            });
        })
    );

    /**
     * GET /api/products/my
     * Lista produtos do vendedor autenticado
     */
    router.get(
        '/my',
        authenticate,
        authorize('seller', 'admin'),
        [
            query('page').optional().isInt({ min: 1 }).toInt(),
            query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        ],
        catchAsync(async (req, res) => {
            const { page = 1, limit = 20 } = req.query;

            const result = await productRepository.listBySeller(
                req.user.id,
                parseInt(page),
                parseInt(limit)
            );

            res.json({
                status: 'success',
                data: {
                    ...result,
                    products: result.products.map(p => p.toJSON()),
                },
            });
        })
    );

    /**
     * GET /api/products/:id
     * Obtém produto por ID
     */
    router.get(
        '/:id',
        optionalAuth,
        catchAsync(async (req, res) => {
            const product = await getProduct.execute(req.params.id, req.user?.id);

            res.json({
                status: 'success',
                data: { product },
            });
        })
    );

    /**
     * POST /api/products
     * Cria novo produto
     */
    router.post(
        '/',
        authenticate,
        authorize('seller', 'admin'),
        [
            body('name').isString().isLength({ min: 3, max: 300 }),
            body('description').optional().isString(),
            body('shortDescription').optional().isString().isLength({ max: 500 }),
            body('productType').isIn(['physical', 'digital', 'service', 'subscription']),
            body('priceCents').isInt({ min: 100 }),
            body('categoryId').optional().isUUID(),
            body('affiliatePct').optional().isFloat({ min: 25, max: 50 }),
            body('maxAffiliateLevels').optional().isInt({ min: 1, max: 5 }),
            body('levelCommission').optional().isArray(),
            body('incomeDistEnabled').optional().isBoolean(),
            body('incomeDistConfig').optional().isArray(),
            body('warrantyDays').optional().isInt({ min: 0, max: 365 }),
            body('recurringDays').optional().isInt({ min: 1, max: 365 }),
        ],
        catchAsync(async (req, res) => {
            const product = await createProduct.execute(req.user.id, req.body);

            res.status(201).json({
                status: 'success',
                message: 'Produto criado com sucesso',
                data: { product: product.toJSON() },
            });
        })
    );

    /**
     * PATCH /api/products/:id
     * Atualiza produto
     */
    router.patch(
        '/:id',
        authenticate,
        authorize('seller', 'admin'),
        catchAsync(async (req, res) => {
            const product = await updateProduct.execute(req.params.id, req.user.id, req.body);

            res.json({
                status: 'success',
                message: 'Produto atualizado com sucesso',
                data: { product: product.toJSON() },
            });
        })
    );

    /**
     * DELETE /api/products/:id
     * Deleta produto (soft delete)
     */
    router.delete(
        '/:id',
        authenticate,
        authorize('seller', 'admin'),
        catchAsync(async (req, res) => {
            const result = await deleteProduct.execute(req.params.id, req.user.id);

            res.json({
                status: 'success',
                message: result.message,
            });
        })
    );

    /**
     * POST /api/products/:id/publish
     * Publica produto (torna ativo)
     */
    router.post(
        '/:id/publish',
        authenticate,
        authorize('seller', 'admin'),
        catchAsync(async (req, res) => {
            const product = await publishProduct.execute(req.params.id, req.user.id);

            res.json({
                status: 'success',
                message: 'Produto publicado com sucesso',
                data: { product: product.toJSON() },
            });
        })
    );

    /**
     * POST /api/products/:id/pause
     * Pausa produto
     */
    router.post(
        '/:id/pause',
        authenticate,
        authorize('seller', 'admin'),
        catchAsync(async (req, res) => {
            const product = await productRepository.pause(req.params.id);

            res.json({
                status: 'success',
                message: 'Produto pausado com sucesso',
                data: { product: product.toJSON() },
            });
        })
    );

    return router;
};

export default createProductRoutes;
