import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, CreditCard, Receipt as ReceiptIcon, AlertCircle } from 'lucide-react';
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
    drivers: ['DEPOT BULK'],
    companyName: 'Your Company Name',
    companyAddress: '123 Business St, City, State 12345',
    companyPhone: '(555) 123-4567'
  });

  const sheetsService = GoogleSheetsService.getInstance();

  useEffect(() => {
    loadSKUData();
  }, [config]);

  const loadSKUData = async () => {
    setIsLoading(true);
    try {
      // Mock data for demonstration since we don't have API key configured
      const mockSKUs: SKU[] = [
        { id: 'sku-1', name: 'Premium Coffee Beans', unitPrice: 15.99, packType: '1lb Bag', packType2: 'Whole Bean' },
        { id: 'sku-2', name: 'Organic Tea Blend', unitPrice: 12.50, packType: '20 Tea Bags', packType2: 'Herbal' },
        { id: 'sku-3', name: 'Artisan Chocolate', unitPrice: 8.75, packType: '4oz Bar', packType2: 'Dark 70%' },
        { id: 'sku-4', name: 'Fresh Pastries', unitPrice: 3.25, packType: 'Individual', packType2: 'Croissant' },
        { id: 'sku-5', name: 'Specialty Milk', unitPrice: 4.50, packType: '1L Carton', packType2: 'Oat Milk' }
      ];
      setSKUs(mockSKUs);
      
      toast({
        title: "SKU Data Loaded",
        description: "Product catalog has been loaded successfully.",
      });
    } catch (error) {
      console.error('Error loading SKU data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load product catalog. Using demo data.",
        variant: "destructive",
      });
      
      // Use demo data as fallback
      const demoSKUs: SKU[] = [
        { id: 'demo-1', name: 'Demo Product 1', unitPrice: 10.00, packType: 'Demo Pack', packType2: '' },
        { id: 'demo-2', name: 'Demo Product 2', unitPrice: 25.00, packType: 'Demo Pack', packType2: '' }
      ];
      setSKUs(demoSKUs);
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

      // Here we would normally write to Google Sheets
      console.log('Order completed:', order);
      
      // For demo purposes, we'll simulate the API calls
      await simulateGoogleSheetsWrite(order);
      
      setCurrentOrder(order);
      setActiveTab('receipt');
      
      toast({
        title: "Order Completed!",
        description: `Order ${order.id} has been processed successfully.`,
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

  const simulateGoogleSheetsWrite = async (order: Order) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Log what would be written to sheets
    console.log('Sales records that would be written:');
    order.items.forEach(item => {
      console.log({
        timestamp: order.timestamp.toISOString(),
        skuName: item.sku.name,
        quantity: item.quantity,
        unitPrice: item.sku.unitPrice,
        lineTotal: item.lineTotal,
        customerName: order.customer.name,
        customerAddress: order.customer.address,
        customerPhone: order.customer.phone,
        driver: order.driver,
        paymentMethod: order.paymentMethod,
        amountPaid: order.amountPaid,
        balance: order.balance
      });
    });
    
    console.log('Payment record that would be written:');
    console.log({
      timestamp: order.timestamp.toISOString(),
      customerName: order.customer.name,
      amount: order.amountPaid,
      paymentMethod: order.paymentMethod,
      reference: order.id
    });
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
    
    const message = `Receipt for Order ${currentOrder.id}
Customer: ${currentOrder.customer.name}
Total: $${currentOrder.total.toFixed(2)}
Paid: $${currentOrder.amountPaid.toFixed(2)}
${currentOrder.balance > 0 ? `Balance: $${currentOrder.balance.toFixed(2)}` : 'Paid in Full'}

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

        {/* API Key Warning */}
        <Alert className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Demo mode: Configure Google Sheets API key in settings for live data.
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
                          ${getOrderTotal().toFixed(2)}
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
                    <p className="text-sm">Amount: ${amountPaid.toFixed(2)}</p>
                    <p className="text-sm">
                      Balance: ${Math.max(0, getOrderTotal() - amountPaid).toFixed(2)}
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
