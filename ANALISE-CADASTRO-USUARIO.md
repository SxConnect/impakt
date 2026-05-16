# 🔍 Análise do Sistema de Cadastro de Usuário - IMPAKT

## 📋 Fluxo Desejado pelo Cliente

1. **Landing Page**: Usuário preenche formulário
2. **Página de Login**: Se não tem conta, clica em "Cadastre-se"
3. **Modal de Cadastro**: Aparece formulário (igual ao da landing page)
4. **Após Cadastro**: Sistema envia mensagem no WhatsApp da SXConnect
5. **Recebe Link**: Usuário recebe link para acessar o sistema
6. **Começa a Usar**: Acessa com o link recebido
7. **Flexibilidade**: Afiliado pode ser vendedor e vice-versa

---

## ✅ Status Atual do Sistema

### 1. Estrutura de Usuário (User.js)

**Campos Disponíveis:**
```javascript
{
  id: UUID,
  email: String,
  phone: String,
  passwordHash: String,
  fullName: String,
  cpfCnpj: String,
  role: 'buyer' | 'seller' | 'affiliate' | 'admin',
  status: 'pending' | 'active' | 'suspended' | 'deleted',
  avatarUrl: String,
  bio: String,
  bankAccount: JSON,
  referralCode: String (único),
  referredBy: UUID,
  emailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date,
  metadata: JSON
}
```

**Métodos de Verificação:**
- ✅ `canSell()` - Verifica se pode vender (role: seller ou admin)
- ✅ `canAffiliate()` - Verifica se pode ser afiliado (role: affiliate, seller ou admin)
- ✅ `canWithdraw()` - Verifica se pode sacar

---

### 2. Cadastro de Usuário (RegisterUser.js)

**Validações Implementadas:**
- ✅ Email válido
- ✅ Senha forte (mínimo 8 caracteres, maiúsculas, minúsculas, números)
- ✅ Nome completo (mínimo 3 caracteres)
- ✅ Role válido (buyer, seller, affiliate)
- ✅ CPF/CNPJ válido (se fornecido)
- ✅ Email único (não pode duplicar)
- ✅ CPF/CNPJ único (não pode duplicar)
- ✅ Código de referência válido (se fornecido)

**Processo de Cadastro:**
1. Valida dados
2. Verifica se email já existe
3. Verifica se CPF/CNPJ já existe (se fornecido)
4. Busca quem indicou (se houver código de referência)
5. Gera hash da senha (bcrypt)
6. Gera código de referência único (para affiliate e seller)
7. Cria usuário com status 'pending'
8. Retorna usuário criado

**Status Inicial:**
- `status: 'pending'` - Requer verificação
- `emailVerified: false` - Email não verificado

---

### 3. Endpoint de Cadastro (userRoutes.js)

**POST /api/users/register**

**Campos Aceitos:**
```javascript
{
  email: String (obrigatório),
  password: String (obrigatório, min 8 caracteres),
  fullName: String (obrigatório, min 3 caracteres),
  phone: String (opcional),
  role: 'buyer' | 'seller' | 'affiliate' (obrigatório),
  cpfCnpj: String (opcional),
  referredByCode: String (opcional)
}
```

**Resposta de Sucesso (201):**
```javascript
{
  status: 'success',
  message: 'Usuário registrado com sucesso',
  data: {
    user: { ...userData }
  }
}
```

---

## ❌ Gaps Identificados (O que falta)

### 1. **Integração com WhatsApp**
- ❌ **NÃO IMPLEMENTADO**: Sistema não envia mensagem para WhatsApp
- ❌ **NÃO IMPLEMENTADO**: Não há integração com SXConnect
- ❌ **NÃO IMPLEMENTADO**: Não há envio de link de acesso

### 2. **Verificação de Email**
- ⚠️ **PARCIALMENTE**: Campo `emailVerified` existe, mas não há fluxo de verificação
- ❌ **NÃO IMPLEMENTADO**: Não envia email de verificação
- ❌ **NÃO IMPLEMENTADO**: Não há endpoint para verificar email

### 3. **Ativação de Conta**
- ⚠️ **PARCIALMENTE**: Usuário criado com status 'pending'
- ❌ **NÃO IMPLEMENTADO**: Não há processo de ativação manual/automática
- ❌ **NÃO IMPLEMENTADO**: Usuário não pode fazer login com status 'pending'

### 4. **Flexibilidade de Roles**
- ⚠️ **LIMITADO**: Usuário só pode ter 1 role por vez
- ❌ **NÃO ATENDE**: "Afiliado pode ser vendedor e vice-versa" não funciona
- ❌ **PROBLEMA**: Precisa escolher entre 'seller' ou 'affiliate' no cadastro

### 5. **Modal de Cadastro**
- ❌ **NÃO IMPLEMENTADO**: Não há página de login
- ❌ **NÃO IMPLEMENTADO**: Não há modal de cadastro
- ❌ **NÃO IMPLEMENTADO**: Frontend não existe ainda

---

## 🔧 O Que Precisa Ser Implementado

### 1. **Integração com WhatsApp (PRIORITÁRIO)**

**Opções:**

#### Opção A: API do WhatsApp Business
```javascript
// Após cadastro bem-sucedido
await whatsappService.sendMessage({
  to: user.phone,
  message: `Olá ${user.fullName}! 
  
Seu cadastro no IMPAKT foi realizado com sucesso! 🎉

Para acessar o sistema, clique no link abaixo:
${process.env.APP_URL}/login?token=${activationToken}

Qualquer dúvida, estamos à disposição!

Equipe IMPAKT`
});
```

#### Opção B: Integração com SXConnect
```javascript
// Webhook ou API da SXConnect
await sxconnectService.sendNotification({
  phone: user.phone,
  template: 'new_user_registration',
  variables: {
    name: user.fullName,
    link: `${process.env.APP_URL}/activate/${activationToken}`
  }
});
```

#### Opção C: Notificação Manual
```javascript
// Envia notificação para admin da SXConnect
await notificationService.notifyAdmin({
  type: 'new_user',
  user: user,
  action: 'send_whatsapp_link'
});
```

---

### 2. **Sistema de Ativação de Conta**

**Criar novo caso de uso: ActivateUser.js**

```javascript
export class ActivateUser {
  async execute(token) {
    // 1. Valida token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 2. Busca usuário
    const user = await userRepository.findById(decoded.userId);
    
    // 3. Ativa conta
    user.status = 'active';
    user.emailVerified = true;
    
    // 4. Salva
    await userRepository.update(user);
    
    return user;
  }
}
```

**Novo endpoint:**
```javascript
// GET /api/users/activate/:token
router.get('/activate/:token', async (req, res) => {
  const user = await activateUser.execute(req.params.token);
  
  // Redireciona para login
  res.redirect('/login?activated=true');
});
```

---

### 3. **Sistema de Múltiplos Roles**

**Opção A: Mudar role para array**
```javascript
// User.js
role: ['seller', 'affiliate'] // Pode ter múltiplos

// Métodos
canSell() {
  return this.roles.includes('seller') || this.roles.includes('admin');
}

canAffiliate() {
  return this.roles.includes('affiliate') || 
         this.roles.includes('seller') || 
         this.roles.includes('admin');
}
```

**Opção B: Adicionar campo roles separado**
```javascript
// User.js
role: 'seller', // Role principal
additionalRoles: ['affiliate'], // Roles adicionais

// Métodos
hasRole(role) {
  return this.role === role || this.additionalRoles.includes(role);
}
```

**Opção C: Simplificar (RECOMENDADO)**
```javascript
// Apenas 2 roles principais:
// - 'seller': Pode vender E ser afiliado
// - 'affiliate': Só pode ser afiliado

// User.js
canSell() {
  return this.role === 'seller' || this.role === 'admin';
}

canAffiliate() {
  // TODOS podem ser afiliados (exceto buyer)
  return this.role !== 'buyer';
}
```

---

### 4. **Frontend - Página de Login e Modal**

**Criar arquivos:**

#### login.html
```html
<!DOCTYPE html>
<html>
<head>
  <title>Login - IMPAKT</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="login-container">
    <h1>Entrar no IMPAKT</h1>
    
    <form id="loginForm">
      <input type="email" placeholder="Email" required>
      <input type="password" placeholder="Senha" required>
      <button type="submit">Entrar</button>
    </form>
    
    <p>
      Não tem conta? 
      <a href="#" id="openRegisterModal">Cadastre-se</a>
    </p>
  </div>
  
  <!-- Modal de Cadastro -->
  <div id="registerModal" class="modal">
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>Criar Conta</h2>
      
      <form id="registerForm">
        <input type="text" name="fullName" placeholder="Nome completo" required>
        <input type="email" name="email" placeholder="Email" required>
        <input type="tel" name="phone" placeholder="WhatsApp" required>
        <input type="password" name="password" placeholder="Senha" required>
        
        <select name="role" required>
          <option value="">Tipo de conta</option>
          <option value="seller">Vendedor</option>
          <option value="affiliate">Afiliado</option>
        </select>
        
        <button type="submit">Cadastrar</button>
      </form>
    </div>
  </div>
  
  <script src="login.js"></script>
</body>
</html>
```

#### login.js
```javascript
// Abrir modal
document.getElementById('openRegisterModal').onclick = () => {
  document.getElementById('registerModal').style.display = 'block';
};

// Fechar modal
document.querySelector('.close').onclick = () => {
  document.getElementById('registerModal').style.display = 'none';
};

// Cadastro
document.getElementById('registerForm').onsubmit = async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  try {
    const response = await fetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Cadastro realizado! Você receberá um link no WhatsApp.');
      document.getElementById('registerModal').style.display = 'none';
    } else {
      alert(result.message);
    }
  } catch (error) {
    alert('Erro ao cadastrar. Tente novamente.');
  }
};
```

---

## 📊 Comparação: Atual vs Desejado

| Funcionalidade | Status Atual | Desejado | Gap |
|----------------|--------------|----------|-----|
| Cadastro via API | ✅ Implementado | ✅ OK | - |
| Validações | ✅ Implementado | ✅ OK | - |
| Código de referência | ✅ Implementado | ✅ OK | - |
| Status pending | ✅ Implementado | ✅ OK | - |
| **WhatsApp** | ❌ Não existe | ✅ Necessário | **CRÍTICO** |
| **Ativação de conta** | ❌ Não existe | ✅ Necessário | **CRÍTICO** |
| **Página de login** | ❌ Não existe | ✅ Necessário | **ALTO** |
| **Modal de cadastro** | ❌ Não existe | ✅ Necessário | **ALTO** |
| **Múltiplos roles** | ⚠️ Limitado | ✅ Necessário | **MÉDIO** |
| Email verificação | ⚠️ Campo existe | ⚠️ Opcional | BAIXO |

---

## 🎯 Recomendações

### Prioridade CRÍTICA (Fazer Agora)

1. **Integração com WhatsApp**
   - Escolher método (API WhatsApp Business, SXConnect, ou manual)
   - Implementar envio de mensagem após cadastro
   - Incluir link de ativação na mensagem

2. **Sistema de Ativação**
   - Criar token de ativação (JWT)
   - Criar endpoint `/api/users/activate/:token`
   - Mudar status de 'pending' para 'active'

### Prioridade ALTA (Fazer Logo)

3. **Página de Login**
   - Criar `login.html`
   - Criar formulário de login
   - Criar link "Cadastre-se"

4. **Modal de Cadastro**
   - Criar modal com formulário
   - Integrar com API `/api/users/register`
   - Mostrar mensagem de sucesso

### Prioridade MÉDIA (Pode Esperar)

5. **Múltiplos Roles**
   - Decidir abordagem (array, campo adicional, ou simplificar)
   - Atualizar schema do banco
   - Atualizar lógica de permissões

6. **Melhorias**
   - Verificação de email (opcional)
   - Recuperação de senha
   - Dashboard inicial

---

## 💡 Solução Simplificada (Recomendada)

### Abordagem de Roles Simplificada

**Ao invés de múltiplos roles, usar lógica:**

```javascript
// Apenas 2 tipos principais:
// 1. SELLER: Pode vender produtos E ser afiliado
// 2. AFFILIATE: Só pode ser afiliado (não vende produtos próprios)

// User.js
canSell() {
  return this.role === 'seller' || this.role === 'admin';
}

canAffiliate() {
  // Sellers também podem ser afiliados!
  return this.role === 'seller' || 
         this.role === 'affiliate' || 
         this.role === 'admin';
}
```

**No formulário de cadastro:**
```html
<select name="role">
  <option value="seller">
    Vendedor (vender produtos + ser afiliado)
  </option>
  <option value="affiliate">
    Afiliado (apenas divulgar produtos)
  </option>
</select>
```

**Vantagens:**
- ✅ Não precisa mudar schema do banco
- ✅ Não precisa mudar código existente
- ✅ Sellers automaticamente podem ser afiliados
- ✅ Simples de entender para o usuário

---

## 📝 Checklist de Implementação

### Backend
- [ ] Criar serviço de WhatsApp (WhatsAppService.js)
- [ ] Criar caso de uso ActivateUser.js
- [ ] Adicionar endpoint POST /api/users/activate/:token
- [ ] Modificar RegisterUser para gerar token de ativação
- [ ] Modificar RegisterUser para enviar WhatsApp
- [ ] Atualizar LoginUser para verificar status 'active'
- [ ] Simplificar lógica de roles (seller pode ser afiliado)

### Frontend
- [ ] Criar página login.html
- [ ] Criar estilos login.css
- [ ] Criar script login.js
- [ ] Implementar modal de cadastro
- [ ] Integrar formulário com API
- [ ] Adicionar mensagens de sucesso/erro
- [ ] Criar página de ativação (activate.html)

### Integração
- [ ] Configurar credenciais WhatsApp Business
- [ ] Testar envio de mensagem
- [ ] Testar fluxo completo de cadastro
- [ ] Testar ativação via link
- [ ] Testar login após ativação

---

## 🎉 Conclusão

**Status Atual:**
- ✅ Backend de cadastro está funcional
- ✅ Validações estão corretas
- ✅ Estrutura de dados está adequada
- ❌ Falta integração com WhatsApp
- ❌ Falta sistema de ativação
- ❌ Falta frontend (login + modal)

**Para Atingir o Fluxo Desejado:**
1. Implementar integração com WhatsApp (CRÍTICO)
2. Implementar sistema de ativação (CRÍTICO)
3. Criar página de login com modal (ALTO)
4. Simplificar roles (seller = vendedor + afiliado) (MÉDIO)

**Próximo Passo Recomendado:**
Começar pela integração com WhatsApp, pois é o ponto central do fluxo desejado.
