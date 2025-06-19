import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, CreditCard, Receipt as ReceiptIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

import SKUCatalog from '@/components/SKUCatalog';
import Cart from '@/components/Cart';
import CustomerForm from '@/components/CustomerForm';
import PaymentForm from '@/components/PaymentForm';
import Receipt from '@/components/Receipt';
import Settings from '@/components/Settings';

import { SKU, CartItem, Customer, Order, AppConfig } from '@/types';
import { GoogleSheetsService } from '@/services/googleSheets';

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('catalog');
  const [skus, setSKUs] = useState<SKU[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: '', address: '', phone: '' });
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'POS' | ''>('');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [config, setConfig] = useState<AppConfig>({
    spreadsheetId: '1Ljddx01jdNdy7KPhO_8BCUMRmQ-iTznyA03DkJYOhMU',
    salesSheetGid: '311399969',
    priceSheetGid: '1324216461',
    paymentsSheetGid: '495567720',
    drivers: ['DEPOT BULK', 'ALABI MUSIBAU', 'LAWAL WILLIAMS'],
    companyName: 'Depot Sales Company',
    companyAddress: 'Warehouse 1 - A Load Out',
    companyPhone: '+234 XXX XXX XXXX',
    googleSheetsApiKey: '' // No longer used with Edge Functions
  });

  const sheetsService = GoogleSheetsService.getInstance();

  useEffect(() => {
    loadSKUData();
  }, [config]);

  const loadSKUData = async () => {
    setIsLoading(true);
    try {
      const skuData = await sheetsService.getSKUData(config);
      setSKUs(skuData);
      
      toast({
        title: "SKU Data Loaded",
        description: `${skuData.length} products loaded from catalog.`,
      });
    } catch (error) {
      console.error('Error loading SKU data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load product catalog. Using offline data.",
        variant: "destructive",
      });
      
      // Use the fallback SKU data
      const fallbackSKUs = await sheetsService.getSKUData(config);
      setSKUs(fallbackSKUs);
    } finally {
      setIsLoading(false);
    }
  };

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
           customer.address.trim() !== '' && 
           customer.phone.trim() !== '' &&
           paymentMethod !== '' &&
           amountPaid >= 0;
  };

  const handleCompleteOrder = async () => {
    if (!canProceedToCheckout()) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const orderTotal = getOrderTotal();
      const balance = Math.max(0, orderTotal - amountPaid);
      
      const order: Order = {
        id: `ORD-${Date.now()}`,
        customer,
        items: cartItems,
        subtotal: orderTotal,
        total: orderTotal,
        paymentMethod: paymentMethod as 'Bank Transfer' | 'POS',
        amountPaid,
        balance,
        timestamp: new Date(),
        driver: config.drivers[0] || 'DEPOT BULK'
      };

      // Write to Google Sheets via Edge Functions
      console.log('Writing order to Google Sheets via Supabase Edge Functions:', order);
      
      await sheetsService.writeSalesRecord(order, config);
      await sheetsService.writePaymentRecord(order, config);
      
      setCurrentOrder(order);
      setActiveTab('receipt');
      
      toast({
        title: "Order Completed!",
        description: `Order ${order.id} has been processed and recorded securely.`,
      });
      
    } catch (error) {
      console.error('Error completing order:', error);
      toast({
        title: "Order Failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
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
    setActiveTab('catalog');
  };

  const handleShareWhatsApp = () => {
    if (!currentOrder) return;
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };
    
    let itemsList = '';
    currentOrder.items.forEach((item, index) => {
      itemsList += `${index + 1}. ${item.sku.name} - Qty: ${item.quantity} x ${formatCurrency(item.sku.unitPrice)} = ${formatCurrency(item.lineTotal)}\n`;
    });
    
    const message = `Receipt for Order ${currentOrder.id}
Customer: ${currentOrder.customer.name}

ITEMS:
${itemsList}
Total: ${formatCurrency(currentOrder.total)}
Paid: ${formatCurrency(currentOrder.amountPaid)}
${currentOrder.balance > 0 ? `Balance: ${formatCurrency(currentOrder.balance)}` : 'Paid in Full'}

Thank you for your business!`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Sales App</h1>
          <Settings config={config} onSave={setConfig} />
        </div>

        {/* Secure Integration Notice */}
        <Alert className="m-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Secure Google Sheets integration active via Supabase Edge Functions.
          </AlertDescription>
        </Alert>

        {/* Main Content */}
        <div className="p-4">
          {currentOrder ? (
            <div className="space-y-4">
              <Receipt 
                order={currentOrder} 
                config={config} 
                onShareWhatsApp={handleShareWhatsApp}
              />
              <Button onClick={handleNewOrder} className="w-full">
                New Order
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="catalog" className="text-xs">
                  <ShoppingCart className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="customer" className="text-xs">
                  <User className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="payment" className="text-xs">
                  <CreditCard className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="summary" className="text-xs">
                  <ReceiptIcon className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="catalog" className="space-y-4">
                <SKUCatalog 
                  skus={skus} 
                  onAddToCart={handleAddToCart}
                  isLoading={isLoading}
                />
                
                {cartItems.length > 0 && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">
                          Cart: {cartItems.length} items
                        </span>
                        <span className="font-bold text-green-600">
                          ₦{getOrderTotal().toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="customer" className="space-y-4">
                <Cart 
                  items={cartItems}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onRemoveItem={handleRemoveFromCart}
                />
                <CustomerForm customer={customer} onChange={setCustomer} />
              </TabsContent>

              <TabsContent value="payment" className="space-y-4">
                <PaymentForm
                  paymentMethod={paymentMethod}
                  amountPaid={amountPaid}
                  orderTotal={getOrderTotal()}
                  onPaymentMethodChange={setPaymentMethod}
                  onAmountPaidChange={setAmountPaid}
                />
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <Cart 
                  items={cartItems}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onRemoveItem={handleRemoveFromCart}
                />
                
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold">Customer:</h3>
                    <p className="text-sm">{customer.name || 'Not provided'}</p>
                    <p className="text-sm">{customer.address || 'Not provided'}</p>
                    <p className="text-sm">{customer.phone || 'Not provided'}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold">Payment:</h3>
                    <p className="text-sm">Method: {paymentMethod || 'Not selected'}</p>
                    <p className="text-sm">Amount: ₦{amountPaid.toLocaleString()}</p>
                    <p className="text-sm">
                      Balance: ₦{Math.max(0, getOrderTotal() - amountPaid).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                
                <Button 
                  onClick={handleCompleteOrder}
                  disabled={!canProceedToCheckout() || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Processing...' : 'Complete Order'}
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
