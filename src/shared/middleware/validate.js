import { validationResult } from 'express-validator';
import { AppError } from '../errors/AppError.js';

/**
 * Middleware de validação
 * Verifica erros de validação do express-validator
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        throw new AppError(errorMessages.join(', '), 400);
    }

    next();
};

export default validate;
