import { AppError } from '../errors/AppError.js';

/**
 * Middleware global de tratamento de erros
 * Deve ser o último middleware registrado no Express
 */
export const errorHandler = (err, req, res, next) => {
    // Define valores padrão
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log do erro no servidor
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Erro capturado:', {
            message: err.message,
            stack: err.stack,
            statusCode: err.statusCode,
        });
    }

    // Erro operacional (esperado) - envia detalhes ao cliente
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    // Erro de validação do express-validator
    if (err.array && typeof err.array === 'function') {
        return res.status(400).json({
            status: 'fail',
            message: 'Erro de validação',
            errors: err.array(),
        });
    }

    // Erro do PostgreSQL
    if (err.code) {
        return handleDatabaseError(err, res);
    }

    // Erro de JWT
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'fail',
            message: 'Token inválido',
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 'fail',
            message: 'Token expirado',
        });
    }

    // Erro programático (não esperado) - não vaza detalhes
    console.error('💥 ERRO CRÍTICO:', err);

    return res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Erro interno do servidor',
    });
};

/**
 * Trata erros específicos do PostgreSQL
 */
const handleDatabaseError = (err, res) => {
    // Violação de constraint única
    if (err.code === '23505') {
        const field = err.detail?.match(/Key \((.+)\)=/)?.[1] || 'campo';
        return res.status(409).json({
            status: 'fail',
            message: `${field} já está em uso`,
        });
    }

    // Violação de foreign key
    if (err.code === '23503') {
        return res.status(400).json({
            status: 'fail',
            message: 'Referência inválida a outro registro',
        });
    }

    // Violação de not null
    if (err.code === '23502') {
        const field = err.column || 'campo obrigatório';
        return res.status(400).json({
            status: 'fail',
            message: `${field} é obrigatório`,
        });
    }

    // Erro genérico de banco
    return res.status(500).json({
        status: 'error',
        message: 'Erro no banco de dados',
    });
};

/**
 * Middleware para capturar rotas não encontradas
 */
export const notFoundHandler = (req, res, next) => {
    const err = new AppError(`Rota ${req.originalUrl} não encontrada`, 404);
    next(err);
};

/**
 * Wrapper para funções assíncronas
 * Evita try-catch em todos os controllers
 */
export const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default errorHandler;
