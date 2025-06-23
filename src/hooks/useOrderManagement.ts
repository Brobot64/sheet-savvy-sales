
import { useState } from 'react';
import { CartItem, Customer, Order, AppConfig } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { GoogleSheetsService } from '@/services/googleSheets';

export const useOrderManagement = (config: AppConfig) => {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: '', address: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'POS' | ''>('');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>(config.drivers[0] || '');
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  const sheetsService = GoogleSheetsService.getInstance();

  const handleAddToCart = (item: CartItem) => {
    const existingIndex = cartItems.findIndex(cartItem => cartItem.sku.id === item.sku.id);
    
    if (existingIndex >= 0) {
      const updatedItems = [...cartItems];
      updatedItems[existingIndex].quantity += item.quantity;
      updatedItems[existingIndex].lineTotal = updatedItems[existingIndex].quantity * updatedItems[existingIndex].sku.unitPrice;
      setCartItems(updatedItems);
    } else {
      setCartItems(prev => [...prev, item]);
    }
    
    toast({
      title: "Added to Cart",
      description: `${item.quantity}x ${item.sku.name} added to cart.`,
    });
  };

  const handleUpdateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(index);
      return;
    }
    
    const updatedItems = [...cartItems];
    updatedItems[index].quantity = quantity;
    updatedItems[index].lineTotal = quantity * updatedItems[index].sku.unitPrice;
    setCartItems(updatedItems);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Item Removed",
      description: "Item has been removed from cart.",
    });
  };

  const getOrderTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.lineTotal, 0);
  };

  const canProceedToCheckout = () => {
    return cartItems.length > 0 && 
           customer.name.trim() !== '' && 
           customer.phone.trim() !== '' &&
           paymentMethod !== '' &&
           selectedDriver.trim() !== '';
  };

  const handleCompleteOrder = async () => {
    if (!canProceedToCheckout()) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields including driver selection.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const orderTotal = getOrderTotal();
      // For backend posting: Use order total if amount paid is 0, otherwise use the actual amount paid
      const backendAmountPaid = amountPaid === 0 ? orderTotal : amountPaid;
      const balance = Math.max(0, orderTotal - amountPaid); // UI balance uses actual amount paid
      
      const order: Order = {
        id: `ORD-${Date.now()}`,
        customer,
        items: cartItems,
        subtotal: orderTotal,
        total: orderTotal,
        paymentMethod: paymentMethod as 'Bank Transfer' | 'POS',
        amountPaid: backendAmountPaid, // This goes to backend - order total when 0 is entered
        balance,
        timestamp: transactionDate, // Use the selected transaction date
        driver: selectedDriver
      };

      console.log('Writing order to Google Sheets with selected date:', {
        orderId: order.id,
        selectedDate: transactionDate,
        formattedDate: transactionDate.toISOString(),
        originalAmountPaid: amountPaid,
        backendAmountPaid: backendAmountPaid
      });
      
      try {
        await sheetsService.writeSalesRecord(order, config);
        await sheetsService.writePaymentRecord(order, config);
      } catch (error) {
        console.error('Google Sheets write error:', error);
        
        if (error.message?.includes('SHEET_PROTECTED')) {
          toast({
            title: "Google Sheets Protection Error",
            description: "The Google Sheet is protected and cannot be edited. Please contact the sheet owner to remove protection or grant edit access to continue recording orders.",
            variant: "destructive",
          });
          return;
        }
        
        // For other errors, still create the order but warn the user
        toast({
          title: "Warning: Data Not Saved to Sheets",
          description: "Order created successfully but could not be saved to Google Sheets. Please check your sheet configuration.",
          variant: "destructive",
        });
      }
      
      // For the receipt and UI, keep the actual amount paid (including 0)
      const displayOrder = {
        ...order,
        amountPaid: amountPaid, // Show actual amount paid in receipt
        balance: Math.max(0, orderTotal - amountPaid)
      };
      
      setCurrentOrder(displayOrder);
      
      toast({
        title: "Order Completed!",
        description: `Order ${order.id} has been processed successfully.`,
      });
      
      return displayOrder;
      
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: "Order Failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewOrder = () => {
    setCartItems([]);
    setCustomer({ name: '', address: '', phone: '' });
    setPaymentMethod('');
    setAmountPaid(0);
    setCurrentOrder(null);
    setSelectedDriver(config.drivers[0] || '');
    setTransactionDate(new Date());
  };

  return {
    cartItems,
    customer,
    paymentMethod,
    amountPaid,
    currentOrder,
    selectedDriver,
    transactionDate,
    isLoading,
    setCustomer,
    setPaymentMethod,
    setAmountPaid,
    setSelectedDriver,
    setTransactionDate,
    handleAddToCart,
    handleUpdateCartQuantity,
    handleRemoveFromCart,
    getOrderTotal,
    canProceedToCheckout,
    handleCompleteOrder,
    handleNewOrder
  };
};
