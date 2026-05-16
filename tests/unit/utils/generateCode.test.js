// tests/unit/utils/generateCode.test.js
// Testa a geração de códigos únicos para links de afiliado

import { generateCode } from '../../../src/shared/utils/validators.js';

describe('generateCode - Geração de códigos únicos', () => {

    describe('Tamanho do código', () => {
        test('Código padrão tem 8 caracteres', () => {
            const code = generateCode();
            expect(code).toHaveLength(8);
        });

        test('Código com tamanho customizado', () => {
            expect(generateCode(4)).toHaveLength(4);
            expect(generateCode(12)).toHaveLength(12);
            expect(generateCode(20)).toHaveLength(20);
        });
    });

    describe('Formato do código', () => {
        test('Código contém apenas letras maiúsculas e números', () => {
            const code = generateCode(100); // Tamanho grande para testar melhor
            expect(code).toMatch(/^[A-Z0-9]+$/);
        });

        test('Código não contém letras minúsculas', () => {
            const code = generateCode(100);
            expect(code).not.toMatch(/[a-z]/);
        });

        test('Código não contém caracteres especiais', () => {
            const code = generateCode(100);
            expect(code).not.toMatch(/[^A-Z0-9]/);
        });
    });

    describe('Unicidade', () => {
        test('Dois códigos gerados são diferentes', () => {
            const code1 = generateCode();
            const code2 = generateCode();
            expect(code1).not.toBe(code2);
        });

        test('100 códigos gerados são todos únicos', () => {
            const codes = new Set();
            for (let i = 0; i < 100; i++) {
                codes.add(generateCode());
            }
            expect(codes.size).toBe(100);
        });

        test('1000 códigos de 12 caracteres são todos únicos', () => {
            const codes = new Set();
            for (let i = 0; i < 1000; i++) {
                codes.add(generateCode(12));
            }
            expect(codes.size).toBe(1000);
        });
    });

    describe('Aleatoriedade', () => {
        test('Códigos têm distribuição variada de caracteres', () => {
            const codes = Array.from({ length: 100 }, () => generateCode(8));
            const allChars = codes.join('');

            // Deve ter pelo menos 10 caracteres diferentes
            const uniqueChars = new Set(allChars);
            expect(uniqueChars.size).toBeGreaterThanOrEqual(10);
        });
    });
});
