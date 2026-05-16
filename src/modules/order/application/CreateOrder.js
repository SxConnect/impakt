import { v4 as uuidv4 } from 'uuid';
import { Order } from '../domain/Order.js';
import { AppError } from '../../../shared/errors/AppError.js';

/**
 * Caso de Uso: Criar Pedido
 * Cria um novo pedido e calcula comissões automaticamente
 */
export class CreateOrder {
    constructor(
        orderRepository,
        productRepository,
        userRepository,
        affiliateLinkRepository,
        calculateOrderCommissions
    ) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.affiliateLinkRepository = affiliateLinkRepository;
        this.calculateOrderCommissions = calculateOrderCommissions;
    }

    async execute(data) {
        const { productId, buyerId, quantity = 1, affiliateLinkCode = null, metadata = {} } = data;

        // 1. Valida produto
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new AppError('Produto não encontrado', 404);
        }

        if (product.status !== 'published') {
            throw new AppError('Produto não está disponível para venda', 400);
        }

        // 2. Valida comprador
        const buyer = await this.userRepository.findById(buyerId);
        if (!buyer) {
            throw new AppError('Comprador não encontrado', 404);
        }

        if (buyer.status !== 'active') {
            throw new AppError('Comprador não está ativo', 400);
        }

        // 3. Valida link de afiliado (se fornecido)
        let affiliateLink = null;
        if (affiliateLinkCode) {
            affiliateLink = await this.affiliateLinkRepository.findByCode(affiliateLinkCode);
            if (!affiliateLink) {
                throw new AppError('Link de afiliado inválido', 400);
            }

            if (affiliateLink.productId !== productId) {
                throw new AppError('Link de afiliado não corresponde ao produto', 400);
            }

            // Registra conversão no link
            await this.affiliateLinkRepository.incrementConversions(affiliateLinkCode);
        }

        // 4. Calcula valores
        const amounts = Order.calculateAmounts(
            product.priceCents,
            quantity,
            1, // Platform fee 1%
            product.affiliatePct
        );

        // 5. Cria pedido
        const order = new Order({
            id: uuidv4(),
            orderNumber: Order.generateOrderNumber(),
            productId: product.id,
            productName: product.name,
            productType: product.productType,
            sellerId: product.sellerId,
            buyerId,
            affiliateLinkCode,
            quantity,
            unitPriceCents: product.priceCents,
            ...amounts,
            status: 'pending',
            metadata,
        });

        const createdOrder = await this.orderRepository.create(order);

        // 6. Calcula comissões (se houver link de afiliado)
        let commissions = null;
        if (affiliateLinkCode) {
            try {
                commissions = await this.calculateOrderCommissions.execute({
                    orderId: createdOrder.id,
                    productId: createdOrder.productId,
                    affiliateLinkCode,
                    priceCents: createdOrder.totalCents,
                    buyerId: createdOrder.buyerId,
                });
            } catch (error) {
                console.error('Erro ao calcular comissões:', error);
                // Não falha o pedido se houver erro nas comissões
                // Pode ser recalculado depois
            }
        }

        return {
            order: createdOrder,
            commissions,
        };
    }
}

export default CreateOrder;
