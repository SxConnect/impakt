// Manual test for CommissionCalculator
// Testa a lógica de cálculo de comissões

import { CommissionCalculator } from '../src/modules/commission/domain/CommissionCalculator.js'

const calc = new CommissionCalculator()

console.log('🧪 TESTANDO COMMISSION CALCULATOR\n')
console.log('═'.repeat(60))

// ═════════════════════════════════════════════════════════════
// TESTE 1: Distribuição por nível
// ═════════════════════════════════════════════════════════════
console.log('\n📊 TESTE 1: Distribuição por nível')
console.log('─'.repeat(60))

const cenarios = [
    { levels: 1, sold_by: 1 },
    { levels: 2, sold_by: 1 },
    { levels: 2, sold_by: 2 },
    { levels: 3, sold_by: 2 },
    { levels: 5, sold_by: 3 },
]

let teste1Pass = true
cenarios.forEach(({ levels, sold_by }) => {
    try {
        const result = calc.distribute({ pool_pct: 40, levels, sold_by_level: sold_by })
        const total = result.reduce((sum, r) => sum + r.pct, 0)

        if (total === 100) {
            console.log(`✅ ${levels} níveis, venda pelo nível ${sold_by}: soma = ${total}%`)
        } else {
            console.log(`❌ ${levels} níveis, venda pelo nível ${sold_by}: soma = ${total}% (esperado 100%)`)
            teste1Pass = false
        }
    } catch (error) {
        console.log(`❌ ${levels} níveis, venda pelo nível ${sold_by}: ERRO - ${error.message}`)
        teste1Pass = false
    }
})

console.log(`\n${teste1Pass ? '✅' : '❌'} Teste 1: ${teste1Pass ? 'PASSOU' : 'FALHOU'}`)

// ═════════════════════════════════════════════════════════════
// TESTE 2: Quem vende recebe a maior fatia
// ═════════════════════════════════════════════════════════════
console.log('\n💰 TESTE 2: Quem vende recebe a maior fatia')
console.log('─'.repeat(60))

let teste2Pass = true

try {
    // 2 níveis - N1 vende
    const result1 = calc.distribute({ pool_pct: 40, levels: 2, sold_by_level: 1 })
    const n1_vende = result1.find(r => r.level === 1)
    const n2_nao_vende = result1.find(r => r.level === 2)

    if (n1_vende.pct > n2_nao_vende.pct) {
        console.log(`✅ N1 vende: N1 (${n1_vende.pct}%) > N2 (${n2_nao_vende.pct}%)`)
    } else {
        console.log(`❌ N1 vende: N1 (${n1_vende.pct}%) NÃO é maior que N2 (${n2_nao_vende.pct}%)`)
        teste2Pass = false
    }

    // 2 níveis - N2 vende
    const result2 = calc.distribute({ pool_pct: 40, levels: 2, sold_by_level: 2 })
    const n1_nao_vende = result2.find(r => r.level === 1)
    const n2_vende = result2.find(r => r.level === 2)

    if (n2_vende.pct > n1_nao_vende.pct) {
        console.log(`✅ N2 vende: N2 (${n2_vende.pct}%) > N1 (${n1_nao_vende.pct}%)`)
    } else {
        console.log(`❌ N2 vende: N2 (${n2_vende.pct}%) NÃO é maior que N1 (${n1_nao_vende.pct}%)`)
        teste2Pass = false
    }

    // 5 níveis - N3 vende
    const result3 = calc.distribute({ pool_pct: 40, levels: 5, sold_by_level: 3 })
    const vendedor = result3.find(r => r.level === 3)
    const outros = result3.filter(r => r.level !== 3)
    const todosmenores = outros.every(r => vendedor.pct > r.pct)

    if (todosmenores) {
        console.log(`✅ N3 vende em cadeia de 5: N3 (${vendedor.pct}%) é maior que todos`)
    } else {
        console.log(`❌ N3 vende em cadeia de 5: N3 (${vendedor.pct}%) NÃO é maior que todos`)
        teste2Pass = false
    }
} catch (error) {
    console.log(`❌ ERRO: ${error.message}`)
    teste2Pass = false
}

console.log(`\n${teste2Pass ? '✅' : '❌'} Teste 2: ${teste2Pass ? 'PASSOU' : 'FALHOU'}`)

// ═════════════════════════════════════════════════════════════
// TESTE 3: Nível mais distante recebe mínimo de 10%
// ═════════════════════════════════════════════════════════════
console.log('\n📏 TESTE 3: Nível mais distante recebe mínimo de 10%')
console.log('─'.repeat(60))

let teste3Pass = true

try {
    // 5 níveis - N5 vende, N1 deve receber >= 10%
    const result1 = calc.distribute({ pool_pct: 40, levels: 5, sold_by_level: 5 })
    const n1 = result1.find(r => r.level === 1)

    if (n1.pct >= 10) {
        console.log(`✅ 5 níveis, N5 vende: N1 recebe ${n1.pct}% (>= 10%)`)
    } else {
        console.log(`❌ 5 níveis, N5 vende: N1 recebe ${n1.pct}% (< 10%)`)
        teste3Pass = false
    }

    // 5 níveis - N1 vende, N5 deve receber >= 10%
    const result2 = calc.distribute({ pool_pct: 40, levels: 5, sold_by_level: 1 })
    const n5 = result2.find(r => r.level === 5)

    if (n5.pct >= 10) {
        console.log(`✅ 5 níveis, N1 vende: N5 recebe ${n5.pct}% (>= 10%)`)
    } else {
        console.log(`❌ 5 níveis, N1 vende: N5 recebe ${n5.pct}% (< 10%)`)
        teste3Pass = false
    }
} catch (error) {
    console.log(`❌ ERRO: ${error.message}`)
    teste3Pass = false
}

console.log(`\n${teste3Pass ? '✅' : '❌'} Teste 3: ${teste3Pass ? 'PASSOU' : 'FALHOU'}`)

// ═════════════════════════════════════════════════════════════
// TESTE 4: Cálculo em centavos
// ═════════════════════════════════════════════════════════════
console.log('\n💵 TESTE 4: Cálculo em centavos')
console.log('─'.repeat(60))

let teste4Pass = true

try {
    // Produto R$100 com 40% para afiliados
    const result = calc.splitCents({
        amount_cents: 10000,
        affiliate_pct: 40,
        levels: 2,
        sold_by_level: 1,
    })

    console.log(`Produto: R$ 100,00`)
    console.log(`Plataforma (1%): R$ ${(result.platform_cents / 100).toFixed(2)}`)
    console.log(`Afiliados (40%): R$ ${(result.affiliate_total / 100).toFixed(2)}`)
    console.log(`Vendedor (59%): R$ ${(result.seller_cents / 100).toFixed(2)}`)

    if (result.platform_cents === 100) {
        console.log(`✅ Plataforma: ${result.platform_cents} centavos (esperado 100)`)
    } else {
        console.log(`❌ Plataforma: ${result.platform_cents} centavos (esperado 100)`)
        teste4Pass = false
    }

    if (result.affiliate_total === 4000) {
        console.log(`✅ Afiliados: ${result.affiliate_total} centavos (esperado 4000)`)
    } else {
        console.log(`❌ Afiliados: ${result.affiliate_total} centavos (esperado 4000)`)
        teste4Pass = false
    }

    if (result.seller_cents === 5900) {
        console.log(`✅ Vendedor: ${result.seller_cents} centavos (esperado 5900)`)
    } else {
        console.log(`❌ Vendedor: ${result.seller_cents} centavos (esperado 5900)`)
        teste4Pass = false
    }

    // Verifica se não perde centavos
    const total = result.platform_cents + result.affiliate_total + result.seller_cents
    if (total === 10000) {
        console.log(`✅ Soma total: ${total} centavos (sem perda)`)
    } else {
        console.log(`❌ Soma total: ${total} centavos (esperado 10000)`)
        teste4Pass = false
    }
} catch (error) {
    console.log(`❌ ERRO: ${error.message}`)
    teste4Pass = false
}

console.log(`\n${teste4Pass ? '✅' : '❌'} Teste 4: ${teste4Pass ? 'PASSOU' : 'FALHOU'}`)

// ═════════════════════════════════════════════════════════════
// TESTE 5: Validações de entrada
// ═════════════════════════════════════════════════════════════
console.log('\n🛡️ TESTE 5: Validações de entrada')
console.log('─'.repeat(60))

let teste5Pass = true

// affiliate_pct abaixo de 25
try {
    calc.splitCents({ amount_cents: 10000, affiliate_pct: 10, levels: 1, sold_by_level: 1 })
    console.log(`❌ affiliate_pct=10 deveria lançar erro`)
    teste5Pass = false
} catch (error) {
    console.log(`✅ affiliate_pct=10 lançou erro: "${error.message}"`)
}

// affiliate_pct acima de 50
try {
    calc.splitCents({ amount_cents: 10000, affiliate_pct: 60, levels: 1, sold_by_level: 1 })
    console.log(`❌ affiliate_pct=60 deveria lançar erro`)
    teste5Pass = false
} catch (error) {
    console.log(`✅ affiliate_pct=60 lançou erro: "${error.message}"`)
}

// levels acima de 5
try {
    calc.distribute({ pool_pct: 40, levels: 6, sold_by_level: 1 })
    console.log(`❌ levels=6 deveria lançar erro`)
    teste5Pass = false
} catch (error) {
    console.log(`✅ levels=6 lançou erro: "${error.message}"`)
}

// amount_cents zero
try {
    calc.splitCents({ amount_cents: 0, affiliate_pct: 40, levels: 1, sold_by_level: 1 })
    console.log(`❌ amount_cents=0 deveria lançar erro`)
    teste5Pass = false
} catch (error) {
    console.log(`✅ amount_cents=0 lançou erro: "${error.message}"`)
}

console.log(`\n${teste5Pass ? '✅' : '❌'} Teste 5: ${teste5Pass ? 'PASSOU' : 'FALHOU'}`)

// ═════════════════════════════════════════════════════════════
// RESUMO FINAL
// ═════════════════════════════════════════════════════════════
console.log('\n' + '═'.repeat(60))
console.log('📋 RESUMO DOS TESTES')
console.log('═'.repeat(60))

const todosPassaram = teste1Pass && teste2Pass && teste3Pass && teste4Pass && teste5Pass

console.log(`Teste 1 (Distribuição): ${teste1Pass ? '✅ PASSOU' : '❌ FALHOU'}`)
console.log(`Teste 2 (Maior fatia): ${teste2Pass ? '✅ PASSOU' : '❌ FALHOU'}`)
console.log(`Teste 3 (Mínimo 10%): ${teste3Pass ? '✅ PASSOU' : '❌ FALHOU'}`)
console.log(`Teste 4 (Centavos): ${teste4Pass ? '✅ PASSOU' : '❌ FALHOU'}`)
console.log(`Teste 5 (Validações): ${teste5Pass ? '✅ PASSOU' : '❌ FALHOU'}`)

console.log('\n' + '═'.repeat(60))
if (todosPassaram) {
    console.log('🎉 TODOS OS TESTES PASSARAM!')
    process.exit(0)
} else {
    console.log('❌ ALGUNS TESTES FALHARAM')
    process.exit(1)
}
