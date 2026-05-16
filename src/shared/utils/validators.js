/**
 * Validadores customizados para a aplicação
 */

/**
 * Valida CPF
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean}
 */
export const isValidCPF = (cpf) => {
    if (!cpf) return false;

    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');

    if (cpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    // Valida primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    // Valida segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;

    return true;
};

/**
 * Valida CNPJ
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {boolean}
 */
export const isValidCNPJ = (cnpj) => {
    if (!cnpj) return false;

    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/[^\d]/g, '');

    if (cnpj.length !== 14) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    // Valida primeiro dígito verificador
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    // Valida segundo dígito verificador
    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += parseInt(numbers.charAt(length - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
};

/**
 * Valida CPF ou CNPJ
 * @param {string} doc - Documento a ser validado
 * @returns {boolean}
 */
export const isValidCPFOrCNPJ = (doc) => {
    if (!doc) return false;

    const cleaned = doc.replace(/[^\d]/g, '');

    if (cleaned.length === 11) return isValidCPF(doc);
    if (cleaned.length === 14) return isValidCNPJ(doc);

    return false;
};

/**
 * Valida e-mail
 * @param {string} email - E-mail a ser validado
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Valida telefone brasileiro
 * @param {string} phone - Telefone a ser validado
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
    if (!phone) return false;

    const cleaned = phone.replace(/[^\d]/g, '');

    // Aceita: (11) 98888-8888 ou (11) 3888-8888
    return cleaned.length === 10 || cleaned.length === 11;
};

/**
 * Valida senha forte
 * @param {string} password - Senha a ser validada
 * @returns {boolean}
 */
export const isStrongPassword = (password) => {
    if (!password || password.length < 8) return false;

    // Pelo menos uma letra maiúscula, uma minúscula e um número
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return hasUpperCase && hasLowerCase && hasNumber;
};

/**
 * Formata valor em centavos para reais
 * @param {number} cents - Valor em centavos
 * @returns {string} Valor formatado (ex: "R$ 100,00")
 */
export const formatCurrency = (cents) => {
    const reais = cents / 100;
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(reais);
};

/**
 * Converte reais para centavos
 * @param {number} reais - Valor em reais
 * @returns {number} Valor em centavos
 */
export const toCents = (reais) => {
    return Math.round(reais * 100);
};

/**
 * Gera código único alfanumérico
 * @param {number} length - Tamanho do código
 * @returns {string}
 */
export const generateCode = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

/**
 * Gera slug a partir de texto
 * @param {string} text - Texto a ser convertido
 * @returns {string}
 */
export const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/--+/g, '-') // Remove hífens duplicados
        .trim();
};

export default {
    isValidCPF,
    isValidCNPJ,
    isValidCPFOrCNPJ,
    isValidEmail,
    isValidPhone,
    isStrongPassword,
    formatCurrency,
    toCents,
    generateCode,
    slugify,
};
