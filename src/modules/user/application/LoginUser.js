import bcrypt from 'bcrypt';
import { UnauthorizedError, ValidationError } from '../../../shared/errors/AppError.js';
import { generateToken } from '../../../shared/middleware/auth.js';

/**
 * Caso de uso: Login de usuário
 * Autentica usuário e retorna token JWT
 */
export class LoginUser {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute({ email, password }) {
        // Validações básicas
        if (!email || !password) {
            throw new ValidationError('E-mail e senha são obrigatórios');
        }

        // Busca usuário por e-mail
        const user = await this.userRepository.findByEmail(email.toLowerCase().trim());

        if (!user) {
            throw new UnauthorizedError('E-mail ou senha incorretos');
        }

        // Verifica se a senha está correta
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedError('E-mail ou senha incorretos');
        }

        // Verifica se o usuário está ativo
        if (user.status === 'pending') {
            throw new UnauthorizedError('Conta não ativada. Verifique seu WhatsApp para ativar sua conta.');
        }

        if (user.status === 'banned' || user.status === 'deleted') {
            throw new UnauthorizedError('Conta desativada. Entre em contato com o suporte.');
        }

        if (user.status === 'suspended') {
            throw new UnauthorizedError('Conta suspensa. Entre em contato com o suporte.');
        }

        // Atualiza último login
        await this.userRepository.updateLastLogin(user.id);

        // Gera token JWT
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
        });

        return {
            user: user.toJSON(),
            token,
        };
    }
}

export default LoginUser;
