import bcrypt from 'bcrypt';
import { NotFoundError, ValidationError, ConflictError } from '../../../shared/errors/AppError.js';
import { isValidCPFOrCNPJ, isValidPhone, isStrongPassword } from '../../../shared/utils/validators.js';

/**
 * Caso de uso: Atualizar perfil do usuário
 */
export class UpdateUserProfile {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(userId, updates) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError('Usuário não encontrado');
        }

        const allowedUpdates = {};

        // Validações e preparação dos dados
        if (updates.fullName !== undefined) {
            if (updates.fullName.trim().length < 3) {
                throw new ValidationError('Nome completo deve ter no mínimo 3 caracteres');
            }
            allowedUpdates.fullName = updates.fullName.trim();
        }

        if (updates.phone !== undefined) {
            if (updates.phone && !isValidPhone(updates.phone)) {
                throw new ValidationError('Telefone inválido');
            }
            allowedUpdates.phone = updates.phone?.trim() || null;
        }

        if (updates.cpfCnpj !== undefined) {
            if (updates.cpfCnpj) {
                if (!isValidCPFOrCNPJ(updates.cpfCnpj)) {
                    throw new ValidationError('CPF/CNPJ inválido');
                }

                // Verifica se já existe outro usuário com este CPF/CNPJ
                const existingUser = await this.userRepository.findByCpfCnpj(updates.cpfCnpj);
                if (existingUser && existingUser.id !== userId) {
                    throw new ConflictError('CPF/CNPJ já cadastrado');
                }

                allowedUpdates.cpfCnpj = updates.cpfCnpj.replace(/[^\d]/g, '');
            } else {
                allowedUpdates.cpfCnpj = null;
            }
        }

        if (updates.bio !== undefined) {
            allowedUpdates.bio = updates.bio?.trim() || null;
        }

        if (updates.avatarUrl !== undefined) {
            allowedUpdates.avatarUrl = updates.avatarUrl?.trim() || null;
        }

        if (updates.bankAccount !== undefined) {
            // Valida estrutura da conta bancária
            if (updates.bankAccount) {
                const { bank, agency, account, accountType, pixKey } = updates.bankAccount;

                if (!bank || !agency || !account) {
                    throw new ValidationError('Dados bancários incompletos');
                }

                allowedUpdates.bankAccount = {
                    bank: bank.trim(),
                    agency: agency.trim(),
                    account: account.trim(),
                    accountType: accountType || 'corrente',
                    pixKey: pixKey?.trim() || null,
                };
            } else {
                allowedUpdates.bankAccount = null;
            }
        }

        if (updates.password !== undefined) {
            if (!isStrongPassword(updates.password)) {
                throw new ValidationError(
                    'Senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas e números'
                );
            }
            allowedUpdates.passwordHash = await bcrypt.hash(updates.password, 10);
        }

        // Atualiza o usuário
        const updatedUser = await this.userRepository.update(userId, allowedUpdates);

        return updatedUser.toJSON();
    }
}

export default UpdateUserProfile;
