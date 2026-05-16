import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ValidationError, ConflictError } from '../../../shared/errors/AppError.js';
import { isValidEmail, isValidCPFOrCNPJ, isStrongPassword, generateCode } from '../../../shared/utils/validators.js';

/**
 * Caso de uso: Registrar novo usuário
 * Regras de negócio para criação de usuário
 */
export class RegisterUser {
    constructor(userRepository, whatsappService = null) {
        this.userRepository = userRepository;
        this.whatsappService = whatsappService;
    }

    async execute({ email, password, fullName, phone, role, cpfCnpj, referredByCode }) {
        // Validações
        if (!email || !isValidEmail(email)) {
            throw new ValidationError('E-mail inválido');
        }

        if (!password || !isStrongPassword(password)) {
            throw new ValidationError(
                'Senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas e números'
            );
        }

        if (!fullName || fullName.trim().length < 3) {
            throw new ValidationError('Nome completo deve ter no mínimo 3 caracteres');
        }

        if (!['buyer', 'seller', 'affiliate'].includes(role)) {
            throw new ValidationError('Tipo de usuário inválido');
        }

        // Valida telefone (obrigatório para receber WhatsApp)
        if (!phone || phone.trim().length < 10) {
            throw new ValidationError('Telefone/WhatsApp é obrigatório');
        }

        // Verifica se e-mail já existe
        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            throw new ConflictError('E-mail já cadastrado');
        }

        // Verifica CPF/CNPJ se fornecido
        if (cpfCnpj) {
            if (!isValidCPFOrCNPJ(cpfCnpj)) {
                throw new ValidationError('CPF/CNPJ inválido');
            }

            const existingCpfCnpj = await this.userRepository.findByCpfCnpj(cpfCnpj);
            if (existingCpfCnpj) {
                throw new ConflictError('CPF/CNPJ já cadastrado');
            }
        }

        // Busca quem indicou (se houver código de referência)
        let referredBy = null;
        if (referredByCode) {
            const referrer = await this.userRepository.findByReferralCode(referredByCode);
            if (!referrer) {
                throw new ValidationError('Código de indicação inválido');
            }
            referredBy = referrer.id;
        }

        // Hash da senha
        const passwordHash = await bcrypt.hash(password, 10);

        // Gera código de referência único para afiliados e vendedores
        let referralCode = null;
        if (role === 'affiliate' || role === 'seller') {
            referralCode = generateCode(8);

            // Garante que o código é único
            let attempts = 0;
            while (await this.userRepository.findByReferralCode(referralCode)) {
                referralCode = generateCode(8);
                attempts++;
                if (attempts > 10) {
                    throw new Error('Erro ao gerar código de referência único');
                }
            }
        }

        // Cria o usuário
        const user = await this.userRepository.create({
            email: email.toLowerCase().trim(),
            passwordHash,
            fullName: fullName.trim(),
            phone: phone?.trim() || null,
            role,
            cpfCnpj: cpfCnpj?.replace(/[^\d]/g, '') || null,
            referralCode,
            referredBy,
            status: 'pending', // Requer verificação de e-mail
            emailVerified: false,
        });

        // Gera token de ativação (válido por 24 horas)
        const activationToken = jwt.sign(
            {
                userId: user.id,
                type: 'activation',
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const activationLink = `${process.env.APP_URL || 'http://localhost:3000'}/activate/${activationToken}`;

        // Envia mensagem de boas-vindas via WhatsApp
        if (this.whatsappService && user.phone) {
            try {
                await this.whatsappService.sendWelcomeMessage({
                    phone: user.phone,
                    name: user.fullName,
                    activationLink
                });
            } catch (error) {
                console.error('Erro ao enviar WhatsApp:', error);
                // Não falha o cadastro se o WhatsApp falhar
                // O usuário pode solicitar reenvio depois
            }
        }

        return {
            user,
            activationToken,
            activationLink
        };
    }
}

export default RegisterUser;
