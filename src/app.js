import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler.js';
import { createContainer } from './shared/container.js';
import { createUserRoutes } from './modules/user/http/userRoutes.js';
import { createProductRoutes } from './modules/product/http/productRoutes.js';
import { createAffiliateRoutes } from './modules/affiliate/http/affiliateRoutes.js';
import { createCommissionRoutes } from './modules/commission/http/commissionRoutes.js';
import { createOrderRoutes } from './modules/order/http/orderRoutes.js';
import { createPaymentRoutes } from './modules/payment/http/paymentRoutes.js';
import { initializeJobs } from './jobs/index.js';

// Carrega variáveis de ambiente
dotenv.config();

// Cria a aplicação Express
const app = express();

// ============================================================
// MIDDLEWARES GLOBAIS
// ============================================================

// Segurança
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));

// Parse de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Log de requisições (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    });
}

// ============================================================
// INJEÇÃO DE DEPENDÊNCIAS
// ============================================================
const container = createContainer();

// ============================================================
// JOBS AGENDADOS
// ============================================================
initializeJobs(container);

// ============================================================
// ROTAS
// ============================================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
    });
});

// Rotas da API
app.use('/api/users', createUserRoutes(container));
app.use('/api/products', createProductRoutes(container));
app.use('/api/affiliates', createAffiliateRoutes(container));
app.use('/api/commissions', createCommissionRoutes(container));
app.use('/api/orders', createOrderRoutes(container));
app.use('/api/payments', createPaymentRoutes(container));

// ============================================================
// TRATAMENTO DE ERROS
// ============================================================

// Rota não encontrada
app.use(notFoundHandler);

// Handler global de erros
app.use(errorHandler);

// ============================================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================================
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log('');
    console.log('🚀 ============================================');
    console.log('🚀 IMPAKT Backend Server');
    console.log('🚀 ============================================');
    console.log(`🚀 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🚀 Servidor rodando na porta: ${PORT}`);
    console.log(`🚀 URL: http://localhost:${PORT}`);
    console.log(`🚀 Health check: http://localhost:${PORT}/health`);
    console.log('🚀 ============================================');
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('⚠️  SIGTERM recebido. Encerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('⚠️  SIGINT recebido. Encerrando servidor...');
    server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
    });
});

export default app;
