/**
 * Classe de erro customizada para a aplicação
 * Permite diferenciar erros de negócio de erros técnicos
 */
export class AppError extends Error {
    /**
     * @param {string} message - Mensagem de erro
     * @param {number} statusCode - Código HTTP do erro
     * @param {boolean} isOperational - Se é um erro operacional (esperado) ou programático
     */
    constructor(message, statusCode = 400, isOperational = true) {
        super(message);

        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        // Captura o stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Erros específicos do domínio
 */
export class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Não autorizado') {
        super(message, 401);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Acesso negado') {
        super(message, 403);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Recurso não encontrado') {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends AppError {
    constructor(message = 'Conflito de dados') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

export class PaymentError extends AppError {
    constructor(message = 'Erro no processamento do pagamento') {
        super(message, 402);
        this.name = 'PaymentError';
    }
}

export default AppError;
