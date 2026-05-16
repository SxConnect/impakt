import jwt from 'jsonwebtoken';
import { ValidationError, NotFoundError, UnauthorizedError } from '../../../shared/errors/AppError.js';

/**
 * Caso de uso: Ativar conta de usuário
 * Ativa conta após verificação via link enviado por WhatsApp
 */
export class ActivateUser {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Ativa usuário usando token de ativação
     */
    async execute(token) {
        if (!token) {
            throw new ValidationError('Token de ativação é obrigatório');
        }

        try {
            // Verifica e decodifica o token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded.type !== 'activation') {
                throw new UnauthorizedError('Token inválido');
            }

            // Busca o usuário
            const user = await this.userRepository.findById(decoded.userId);

            if (!user) {
                throw new NotFoundError('Usuário não encontrado');
            }

            // Verifica se já está ativo
            if (user.status === 'active') {
                return {
                    user,
                    alreadyActive: true,
                    message: 'Conta já está ativa'
                };
            }

            // Verifica se a conta não foi suspensa ou deletada
            if (user.status === 'suspended') {
                throw new UnauthorizedError('Conta suspensa. Entre em contato com o suporte.');
            }

            if (user.status === 'deleted') {
                throw new UnauthorizedError('Conta deletada. Entre em contato com o suporte.');
            }

            // Ativa a conta
            const updatedUser = await this.userRepository.update(user.id, {
                status: 'active',
                emailVerified: true,
                updatedAt: new Date()
            });

            return {
                user: updatedUser,
                alreadyActive: false,
                message: 'Conta ativada com sucesso'
            };

        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedError('Token inválido');
            }

            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Token expirado. Solicite um novo link de ativação.');
            }

            throw error;
        }
    }

    /**
     * Gera novo token de ativação
     */
    async generateActivationToken(userId) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError('Usuário não encontrado');
        }

        if (user.status === 'active') {
            throw new ValidationError('Conta já está ativa');
        }

        // Gera token válido por 24 horas
        const token = jwt.sign(
            {
                userId: user.id,
                type: 'activation',
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        return {
            token,
            activationLink: `${process.env.APP_URL}/activate/${token}`,
            expiresIn: '24 horas'
        };
    }

    /**
     * Reenvia link de ativação
     */
    async resendActivationLink(email, whatsappService) {
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            throw new NotFoundError('Usuário não encontrado');
        }

        if (user.status === 'active') {
            throw new ValidationError('Conta já está ativa');
        }

        if (!user.phone) {
            throw new ValidationError('Usuário não possui telefone cadastrado');
        }

        // Gera novo token
        const { token, activationLink } = await this.generateActivationToken(user.id);

        // Envia via WhatsApp
        await whatsappService.sendWelcomeMessage({
            phone: user.phone,
            name: user.fullName,
            activationLink
        });

        return {
            message: 'Link de ativação reenviado com sucesso',
            sentTo: user.phone
        };
    }
}

export default ActivateUser;
