import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';
import { catchAsync } from './errorHandler.js';

/**
 * Middleware de autenticação JWT
 * Verifica se o token é válido e adiciona o usuário ao request
 */
export const authenticate = catchAsync(async (req, res, next) => {
    // Extrai o token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Token não fornecido');
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    try {
        // Verifica e decodifica o token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Adiciona os dados do usuário ao request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            status: decoded.status,
        };

        // Verifica se o usuário está ativo
        if (req.user.status !== 'active') {
            throw new ForbiddenError('Usuário inativo ou suspenso');
        }

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new UnauthorizedError('Token inválido');
        }
        if (error.name === 'TokenExpiredError') {
            throw new UnauthorizedError('Token expirado');
        }
        throw error;
    }
});

/**
 * Middleware de autorização por role
 * Verifica se o usuário tem permissão para acessar a rota
 * @param {...string} allowedRoles - Roles permitidas
 */
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new UnauthorizedError('Usuário não autenticado');
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new ForbiddenError('Você não tem permissão para acessar este recurso');
        }

        next();
    };
};

/**
 * Middleware opcional de autenticação
 * Adiciona o usuário ao request se o token for válido, mas não bloqueia se não houver token
 */
export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            status: decoded.status,
        };
    } catch (error) {
        // Ignora erros de token inválido no modo opcional
    }

    next();
};

/**
 * Gera um token JWT
 * @param {Object} payload - Dados a serem incluídos no token
 * @returns {string} Token JWT
 */
export const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

/**
 * Verifica se o usuário autenticado é o dono do recurso ou admin
 * @param {string} resourceUserId - ID do usuário dono do recurso
 */
export const isOwnerOrAdmin = (resourceUserId) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new UnauthorizedError('Usuário não autenticado');
        }

        const isOwner = req.user.id === resourceUserId;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            throw new ForbiddenError('Você não tem permissão para acessar este recurso');
        }

        next();
    };
};

export default {
    authenticate,
    authorize,
    optionalAuth,
    generateToken,
    isOwnerOrAdmin,
};
