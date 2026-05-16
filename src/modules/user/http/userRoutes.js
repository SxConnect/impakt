import express from 'express';
import { body } from 'express-validator';
import { catchAsync } from '../../../shared/middleware/errorHandler.js';
import { authenticate, authorize } from '../../../shared/middleware/auth.js';
import { ValidationError } from '../../../shared/errors/AppError.js';

/**
 * Rotas HTTP do módulo de usuários
 * Adaptador de entrada - recebe requisições HTTP e delega para os casos de uso
 */
export const createUserRoutes = (dependencies) => {
    const router = express.Router();
    const {
        registerUser,
        loginUser,
        getUserProfile,
        updateUserProfile,
        activateUser
    } = dependencies;

    /**
     * POST /api/users/register
     * Registra novo usuário
     */
    router.post(
        '/register',
        [
            body('email').isEmail().withMessage('E-mail inválido'),
            body('password').isLength({ min: 8 }).withMessage('Senha deve ter no mínimo 8 caracteres'),
            body('fullName').isLength({ min: 3 }).withMessage('Nome deve ter no mínimo 3 caracteres'),
            body('role').isIn(['buyer', 'seller', 'affiliate']).withMessage('Tipo de usuário inválido'),
        ],
        catchAsync(async (req, res) => {
            const { email, password, fullName, phone, role, cpfCnpj, referredByCode } = req.body;

            const user = await registerUser.execute({
                email,
                password,
                fullName,
                phone,
                role,
                cpfCnpj,
                referredByCode,
            });

            res.status(201).json({
                status: 'success',
                message: 'Usuário registrado com sucesso. Verifique seu WhatsApp para ativar sua conta.',
                data: {
                    user: result.user.toJSON(),
                    requiresActivation: true,
                    activationSentTo: result.user.phone
                },
            });
        })
    );

    /**
     * GET /api/users/activate/:token
     * Ativa conta do usuário via token
     */
    router.get(
        '/activate/:token',
        catchAsync(async (req, res) => {
            const { token } = req.params;

            const result = await activateUser.execute(token);

            res.json({
                status: 'success',
                message: result.message,
                data: {
                    user: result.user.toJSON(),
                    alreadyActive: result.alreadyActive
                },
            });
        })
    );

    /**
     * POST /api/users/resend-activation
     * Reenvia link de ativação
     */
    router.post(
        '/resend-activation',
        [
            body('email').isEmail().withMessage('E-mail inválido'),
        ],
        catchAsync(async (req, res) => {
            const { email } = req.body;

            const result = await activateUser.resendActivationLink(email);

            res.json({
                status: 'success',
                message: result.message,
                data: {
                    sentTo: result.sentTo
                },
            });
        })
    );

    /**
     * POST /api/users/login
     * Autentica usuário
     */
    router.post(
        '/login',
        [
            body('email').isEmail().withMessage('E-mail inválido'),
            body('password').notEmpty().withMessage('Senha é obrigatória'),
        ],
        catchAsync(async (req, res) => {
            const { email, password } = req.body;

            const result = await loginUser.execute({ email, password });

            res.json({
                status: 'success',
                message: 'Login realizado com sucesso',
                data: result,
            });
        })
    );

    /**
     * GET /api/users/me
     * Retorna perfil do usuário autenticado
     */
    router.get(
        '/me',
        authenticate,
        catchAsync(async (req, res) => {
            const user = await getUserProfile.execute(req.user.id);

            res.json({
                status: 'success',
                data: { user },
            });
        })
    );

    /**
     * PATCH /api/users/me
     * Atualiza perfil do usuário autenticado
     */
    router.patch(
        '/me',
        authenticate,
        catchAsync(async (req, res) => {
            const updates = req.body;

            // Remove campos que não podem ser atualizados diretamente
            delete updates.id;
            delete updates.email; // E-mail não pode ser alterado (por enquanto)
            delete updates.role;
            delete updates.status;
            delete updates.referralCode;
            delete updates.referredBy;
            delete updates.emailVerified;
            delete updates.createdAt;
            delete updates.updatedAt;

            const user = await updateUserProfile.execute(req.user.id, updates);

            res.json({
                status: 'success',
                message: 'Perfil atualizado com sucesso',
                data: { user },
            });
        })
    );

    /**
     * GET /api/users/:id
     * Retorna perfil público de um usuário
     */
    router.get(
        '/:id',
        catchAsync(async (req, res) => {
            const user = await getUserProfile.execute(req.params.id);

            // Retorna apenas dados públicos
            res.json({
                status: 'success',
                data: {
                    user: {
                        id: user.id,
                        fullName: user.fullName,
                        avatarUrl: user.avatarUrl,
                        bio: user.bio,
                        role: user.role,
                    },
                },
            });
        })
    );

    return router;
};

export default createUserRoutes;
