
import { Order, AppConfig } from '@/types';

export const useWhatsAppShare = () => {
  const handleShareWhatsApp = (order: Order, config: AppConfig) => {
    if (!order) return;
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const separator = '─'.repeat(35);
    let message = `📋 *SALES RECEIPT*\n`;
    message += `Order: ${order.id}\n`;
    message += `Date: ${order.timestamp.toLocaleDateString('en-GB')}\n`;
    message += `Driver: ${order.driver}\n\n`;
    
    message += `👤 *Customer:*\n`;
    message += `${order.customer.name}\n`;
    if (order.customer.address) {
      message += `${order.customer.address}\n`;
    }
    message += `${order.customer.phone}\n\n`;
    
    message += `🛒 *Items:*\n`;
    message += `${separator}\n`;
    message += `S/N | SKU | Qty | Price | Total\n`;
    message += `${separator}\n`;
    
    order.items.forEach((item, index) => {
      const line = `${String(index + 1).padStart(2)} | ${item.sku.name.substring(0, 12)} | ${String(item.quantity).padStart(2)} | ${formatCurrency(item.sku.unitPrice)} | ${formatCurrency(item.lineTotal)}`;
      message += `${line}\n`;
    });
    
    message += `${separator}\n`;
    message += `💰 *TOTAL: ${formatCurrency(order.total)}*\n`;
    message += `💳 Payment: ${order.paymentMethod}\n`;
    message += `💵 Paid: ${formatCurrency(order.amountPaid)}\n`;
    
    if (order.balance > 0) {
      message += `🔴 Balance: ${formatCurrency(order.balance)}\n`;
    } else {
      message += `✅ *PAID IN FULL*\n`;
    }
    
    message += `\n🏢 ${config.companyName}\n`;
    message += `📍 ${config.companyAddress}\n`;
    message += `📞 ${config.companyPhone}\n\n`;
    message += `Thank you for your business! 🙏`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return { handleShareWhatsApp };
};
