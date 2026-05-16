import { NotFoundError } from '../../../shared/errors/AppError.js';

/**
 * Caso de uso: Obter perfil do usuário
 */
export class GetUserProfile {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    async execute(userId) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new NotFoundError('Usuário não encontrado');
        }

        return user.toJSON();
    }
}

export default GetUserProfile;
