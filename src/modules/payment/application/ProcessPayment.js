import { v4 as uuidv4 } from 'uuid';
import { Payment } from '../domain/Payment.js';
import { AppError } from '../../../shared/errors/AppError.js';

/**
 * Caso de Uso: Processar Pagamento
 * Processa um pagamento usando o gateway configurado
 */
export class ProcessPayment {
    constructor(
        paymentRepository,
        orderRepository,
        userRepository,
        paymentGatewayFactory,
        confirmPayment
    ) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.paymentGatewayFactory = paymentGatewayFactory;
        this.confirmPayment = confirmPayment;
    }

    async execute(data) {
        const {
            orderId,
            provider, // 'pagarme', 'stripe', 'asaas'
            method, // 'credit_card', 'boleto', 'pix'
            paymentData, // Dados específicos do método
        } = data;

        // 1. Valida pedido
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new AppError('Pedido não encontrado', 404);
        }

        if (order.status !== 'pending') {
            throw new AppError(`Pedido não pode ser pago. Status: ${order.status}`, 400);
        }

        // 2. Verifica se já existe pagamento para este pedido
        const existingPayment = await this.paymentRepository.findByOrderId(orderId);
        if (existingPayment && existingPayment.status === 'paid') {
            throw new AppError('Pedido já foi pago', 400);
        }

        // 3. Busca dados do comprador
        const buyer = await this.userRepository.findById(order.buyerId);
        if (!buyer) {
            throw new AppError('Comprador não encontrado', 404);
        }

        // 4. Cria gateway de pagamento
        const gateway = this.paymentGatewayFactory.create(provider);

        // 5. Cria ou busca cliente no gateway
        let customerId = paymentData.customerId;
        if (!customerId) {
            const customerResult = await gateway.createCustomer({
                name: buyer.name,
                email: buyer.email,
                document: buyer.cpfCnpj,
                phone: buyer.phone,
                address: buyer.address,
            });
            customerId = customerResult.customerId;
        }

        // 6. Processa pagamento de acordo com o método
        let gatewayResult;
        const paymentPayload = {
            customerId,
            amountCents: order.totalCents,
            orderId: order.id,
            ...paymentData,
        };

        try {
            switch (method) {
                case 'credit_card':
                    gatewayResult = await gateway.processCreditCard(paymentPayload);
                    break;

                case 'boleto':
                    gatewayResult = await gateway.generateBoleto(paymentPayload);
                    break;

                case 'pix':
                    gatewayResult = await gateway.generatePix(paymentPayload);
                    break;

                default:
                    throw new AppError(`Método de pagamento não suportado: ${method}`, 400);
            }
        } catch (error) {
            throw new AppError(`Erro ao processar pagamento: ${error.message}`, 500);
        }

        // 7. Cria registro de pagamento
        const payment = new Payment({
            id: uuidv4(),
            orderId: order.id,
            provider,
            providerPaymentId: gatewayResult.paymentId,
            providerCustomerId: customerId,
            method,
            amountCents: order.totalCents,
            status: gatewayResult.status || 'pending',
            installments: paymentData.installments || 1,
            cardBrand: paymentData.cardBrand,
            cardLastDigits: paymentData.cardLastDigits,
            boletoUrl: gatewayResult.boletoUrl,
            boletoBarcode: gatewayResult.boletoBarcode,
            pixQrCode: gatewayResult.pixQrCode,
            pixQrCodeUrl: gatewayResult.pixQrCodeUrl,
            metadata: paymentData.metadata || {},
            providerResponse: gatewayResult.providerResponse || {},
        });

        const createdPayment = await this.paymentRepository.create(payment);

        // 8. Se pagamento foi confirmado imediatamente (cartão), confirma o pedido
        if (createdPayment.status === 'paid') {
            await this.confirmPayment.execute(
                order.id,
                createdPayment.providerPaymentId,
                method
            );
        }

        return createdPayment;
    }
}

export default ProcessPayment;
