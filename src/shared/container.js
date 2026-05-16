/**
 * Container de Injeção de Dependências
 * Único lugar que conhece todas as implementações concretas
 * Facilita testes e troca de implementações
 */

// Repositórios (Infraestrutura)
import { PostgresUserRepository } from '../modules/user/infrastructure/PostgresUserRepository.js';
import { PostgresProductRepository } from '../modules/product/infrastructure/PostgresProductRepository.js';
import { PostgresAffiliateLinkRepository } from '../modules/affiliate/infrastructure/PostgresAffiliateLinkRepository.js';
import { PostgresCommissionRepository } from '../modules/commission/infrastructure/PostgresCommissionRepository.js';
import { PostgresOrderRepository } from '../modules/order/infrastructure/PostgresOrderRepository.js';
import { PostgresPaymentRepository } from '../modules/payment/infrastructure/PostgresPaymentRepository.js';

// Payment Gateway Factory
import { PaymentGatewayFactory } from '../modules/payment/infrastructure/gateways/PaymentGatewayFactory.js';

// Email Service
import { NodemailerEmailService } from '../modules/notification/infrastructure/NodemailerEmailService.js';

// WhatsApp Service
import { WhatsAppService } from '../shared/services/WhatsAppService.js';

// Casos de Uso - User
import { RegisterUser } from '../modules/user/application/RegisterUser.js';
import { LoginUser } from '../modules/user/application/LoginUser.js';
import { GetUserProfile } from '../modules/user/application/GetUserProfile.js';
import { UpdateUserProfile } from '../modules/user/application/UpdateUserProfile.js';
import { ActivateUser } from '../modules/user/application/ActivateUser.js';

// Casos de Uso - Product
import { CreateProduct } from '../modules/product/application/CreateProduct.js';
import { GetProduct } from '../modules/product/application/GetProduct.js';
import { ListProducts } from '../modules/product/application/ListProducts.js';
import { UpdateProduct } from '../modules/product/application/UpdateProduct.js';
import { DeleteProduct } from '../modules/product/application/DeleteProduct.js';
import { PublishProduct } from '../modules/product/application/PublishProduct.js';

// Casos de Uso - Affiliate
import { GenerateAffiliateLink } from '../modules/affiliate/application/GenerateAffiliateLink.js';
import { GetAffiliateLinks } from '../modules/affiliate/application/GetAffiliateLinks.js';
import { GetAffiliateDashboard } from '../modules/affiliate/application/GetAffiliateDashboard.js';
import { TrackClick } from '../modules/affiliate/application/TrackClick.js';
import { GetProductAffiliates } from '../modules/affiliate/application/GetProductAffiliates.js';

// Casos de Uso - Commission
import { CalculateOrderCommissions } from '../modules/commission/application/CalculateOrderCommissions.js';
import { ReleaseCommissions } from '../modules/commission/application/ReleaseCommissions.js';
import { CancelCommissions } from '../modules/commission/application/CancelCommissions.js';
import { GetCommissions } from '../modules/commission/application/GetCommissions.js';
import { GetCommissionSummary } from '../modules/commission/application/GetCommissionSummary.js';
import { GetCommissionsByPeriod } from '../modules/commission/application/GetCommissionsByPeriod.js';

// Casos de Uso - Order
import { CreateOrder } from '../modules/order/application/CreateOrder.js';
import { GetOrder } from '../modules/order/application/GetOrder.js';
import { ListOrders } from '../modules/order/application/ListOrders.js';
import { ConfirmPayment } from '../modules/order/application/ConfirmPayment.js';
import { CancelOrder } from '../modules/order/application/CancelOrder.js';
import { GetOrderStats } from '../modules/order/application/GetOrderStats.js';

// Casos de Uso - Payment
import { ProcessPayment } from '../modules/payment/application/ProcessPayment.js';
import { HandleWebhook } from '../modules/payment/application/HandleWebhook.js';
import { GetPayment } from '../modules/payment/application/GetPayment.js';
import { RefundPayment } from '../modules/payment/application/RefundPayment.js';

/**
 * Cria e configura todas as dependências da aplicação
 */
export const createContainer = () => {
    // ============================================================
    // REPOSITÓRIOS
    // ============================================================
    const userRepository = new PostgresUserRepository();
    const productRepository = new PostgresProductRepository();
    const affiliateLinkRepository = new PostgresAffiliateLinkRepository();
    const commissionRepository = new PostgresCommissionRepository();
    const orderRepository = new PostgresOrderRepository();
    const paymentRepository = new PostgresPaymentRepository();

    // ============================================================
    // SERVIÇOS
    // ============================================================
    const emailService = new NodemailerEmailService();
    const whatsappService = new WhatsAppService();

    // ============================================================
    // CASOS DE USO - USER
    // ============================================================
    const registerUser = new RegisterUser(userRepository, whatsappService);
    const loginUser = new LoginUser(userRepository);
    const getUserProfile = new GetUserProfile(userRepository);
    const updateUserProfile = new UpdateUserProfile(userRepository);
    const activateUser = new ActivateUser(userRepository);

    // ============================================================
    // CASOS DE USO - PRODUCT
    // ============================================================
    const createProduct = new CreateProduct(productRepository, userRepository);
    const getProduct = new GetProduct(productRepository);
    const listProducts = new ListProducts(productRepository);
    const updateProduct = new UpdateProduct(productRepository, userRepository);
    const deleteProduct = new DeleteProduct(productRepository, userRepository);
    const publishProduct = new PublishProduct(productRepository, userRepository);

    // ============================================================
    // CASOS DE USO - AFFILIATE
    // ============================================================
    const generateAffiliateLink = new GenerateAffiliateLink(affiliateLinkRepository, productRepository, userRepository);
    const getAffiliateLinks = new GetAffiliateLinks(affiliateLinkRepository);
    const getAffiliateDashboard = new GetAffiliateDashboard(affiliateLinkRepository, userRepository);
    const trackClick = new TrackClick(affiliateLinkRepository);
    const getProductAffiliates = new GetProductAffiliates(affiliateLinkRepository, productRepository, userRepository);

    // ============================================================
    // CASOS DE USO - COMMISSION
    // ============================================================
    const calculateOrderCommissions = new CalculateOrderCommissions(
        commissionRepository,
        affiliateLinkRepository,
        productRepository,
        userRepository
    );
    const releaseCommissions = new ReleaseCommissions(commissionRepository);
    const cancelCommissions = new CancelCommissions(commissionRepository);
    const getCommissions = new GetCommissions(commissionRepository);
    const getCommissionSummary = new GetCommissionSummary(commissionRepository);
    const getCommissionsByPeriod = new GetCommissionsByPeriod(commissionRepository);

    // ============================================================
    // CASOS DE USO - ORDER
    // ============================================================
    const confirmPayment = new ConfirmPayment(orderRepository, commissionRepository);
    const createOrder = new CreateOrder(
        orderRepository,
        productRepository,
        userRepository,
        affiliateLinkRepository,
        calculateOrderCommissions
    );
    const getOrder = new GetOrder(orderRepository, userRepository);
    const listOrders = new ListOrders(orderRepository);
    const cancelOrder = new CancelOrder(orderRepository, cancelCommissions);
    const getOrderStats = new GetOrderStats(orderRepository);

    // ============================================================
    // CASOS DE USO - PAYMENT
    // ============================================================
    const processPayment = new ProcessPayment(
        paymentRepository,
        orderRepository,
        userRepository,
        PaymentGatewayFactory,
        confirmPayment
    );
    const handleWebhook = new HandleWebhook(
        paymentRepository,
        PaymentGatewayFactory,
        confirmPayment
    );
    const getPayment = new GetPayment(paymentRepository, orderRepository);
    const refundPayment = new RefundPayment(
        paymentRepository,
        orderRepository,
        PaymentGatewayFactory,
        cancelCommissions
    );

    // ============================================================
    // RETORNA TODAS AS DEPENDÊNCIAS
    // ============================================================
    return {
        // Repositórios
        userRepository,
        productRepository,
        affiliateLinkRepository,
        commissionRepository,
        orderRepository,
        paymentRepository,

        // Serviços
        emailService,
        whatsappService,

        // Casos de uso - User
        registerUser,
        loginUser,
        getUserProfile,
        updateUserProfile,
        activateUser,

        // Casos de uso - Product
        createProduct,
        getProduct,
        listProducts,
        updateProduct,
        deleteProduct,
        publishProduct,

        // Casos de uso - Affiliate
        generateAffiliateLink,
        getAffiliateLinks,
        getAffiliateDashboard,
        trackClick,
        getProductAffiliates,

        // Casos de uso - Commission
        calculateOrderCommissions,
        releaseCommissions,
        cancelCommissions,
        getCommissions,
        getCommissionSummary,
        getCommissionsByPeriod,

        // Casos de uso - Order
        createOrder,
        getOrder,
        listOrders,
        confirmPayment,
        cancelOrder,
        getOrderStats,

        // Casos de uso - Payment
        processPayment,
        handleWebhook,
        getPayment,
        refundPayment,
    };
};

export default createContainer;
