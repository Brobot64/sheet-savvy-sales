
import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, CreditCard, Receipt as ReceiptIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import SKUCatalog from '@/components/SKUCatalog';
import Cart from '@/components/Cart';
import CustomerForm from '@/components/CustomerForm';
import PaymentForm from '@/components/PaymentForm';
import Receipt from '@/components/Receipt';
import Settings from '@/components/Settings';
import DriverSelector from '@/components/DriverSelector';
import OrderSummary from '@/components/OrderSummary';

import { SKU, AppConfig } from '@/types';
import { GoogleSheetsService } from '@/services/googleSheets';
import { useOrderManagement } from '@/hooks/useOrderManagement';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('catalog');
  const [skus, setSKUs] = useState<SKU[]>([]);
  const [isLoadingSKUs, setIsLoadingSKUs] = useState(false);
  
  const [config, setConfig] = useState<AppConfig>({
    spreadsheetId: '1Ljddx01jdNdy7KPhO_8BCUMRmQ-iTznyA03DkJYOhMU',
    salesSheetGid: '311399969',
    priceSheetGid: '1324216461',
    paymentsSheetGid: '495567720',
    drivers: ['DEPOT BULK', 'ALABI MUSIBAU', 'LAWAL WILLIAMS'],
    companyName: 'Depot Sales Company',
    companyAddress: 'Warehouse 1 - A Load Out',
    companyPhone: '+234 XXX XXX XXXX',
    googleSheetsApiKey: ''
  });

  const {
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
  } = useOrderManagement(config);

  const sheetsService = GoogleSheetsService.getInstance();

  useEffect(() => {
    loadSKUData();
  }, [config]);

  const loadSKUData = async () => {
    setIsLoadingSKUs(true);
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
      
      const fallbackSKUs = await sheetsService.getSKUData(config);
      setSKUs(fallbackSKUs);
    } finally {
      setIsLoadingSKUs(false);
    }
  };

  const handleCompleteOrderWithNavigation = async () => {
    try {
      const order = await handleCompleteOrder();
      if (order) {
        setActiveTab('receipt');
      }
    } catch (error) {
      // Error handling is done in the hook
    }
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

    // Create a more structured table format for WhatsApp
    const separator = '─'.repeat(35);
    let message = `📋 *SALES RECEIPT*\n`;
    message += `Order: ${currentOrder.id}\n`;
    message += `Date: ${currentOrder.timestamp.toLocaleDateString('en-GB')}\n`;
    message += `Driver: ${currentOrder.driver}\n\n`;
    
    message += `👤 *Customer:*\n`;
    message += `${currentOrder.customer.name}\n`;
    if (currentOrder.customer.address) {
      message += `${currentOrder.customer.address}\n`;
    }
    message += `${currentOrder.customer.phone}\n\n`;
    
    message += `🛒 *Items:*\n`;
    message += `${separator}\n`;
    message += `S/N | SKU | Qty | Price | Total\n`;
    message += `${separator}\n`;
    
    currentOrder.items.forEach((item, index) => {
      const line = `${String(index + 1).padStart(2)} | ${item.sku.name.substring(0, 12)} | ${String(item.quantity).padStart(2)} | ${formatCurrency(item.sku.unitPrice)} | ${formatCurrency(item.lineTotal)}`;
      message += `${line}\n`;
    });
    
    message += `${separator}\n`;
    message += `💰 *TOTAL: ${formatCurrency(currentOrder.total)}*\n`;
    message += `💳 Payment: ${currentOrder.paymentMethod}\n`;
    message += `💵 Paid: ${formatCurrency(currentOrder.amountPaid)}\n`;
    
    if (currentOrder.balance > 0) {
      message += `🔴 Balance: ${formatCurrency(currentOrder.balance)}\n`;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">GrandPro Sales App</h1>
          <Settings config={config} onSave={setConfig} />
        </div>

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
                <TabsTrigger value="catalog" className="flex flex-col gap-1">
                  <div className="bg-white text-blue-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</div>
                  <ShoppingCart className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="customer" className="flex flex-col gap-1">
                  <div className="bg-white text-green-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</div>
                  <User className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex flex-col gap-1">
                  <div className="bg-white text-orange-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</div>
                  <CreditCard className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex flex-col gap-1">
                  <div className="bg-white text-purple-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</div>
                  <ReceiptIcon className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              <TabsContent value="catalog" className="space-y-4">
                <DriverSelector 
                  drivers={config.drivers}
                  selectedDriver={selectedDriver}
                  onDriverChange={setSelectedDriver}
                  selectedDate={transactionDate}
                  onDateChange={setTransactionDate}
                />
                
                <SKUCatalog 
                  skus={skus} 
                  onAddToCart={handleAddToCart}
                  isLoading={isLoadingSKUs}
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
                <OrderSummary
                  cartItems={cartItems}
                  customer={customer}
                  paymentMethod={paymentMethod}
                  amountPaid={amountPaid}
                  selectedDriver={selectedDriver}
                  orderTotal={getOrderTotal()}
                  canProceedToCheckout={canProceedToCheckout()}
                  isLoading={isLoading}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onRemoveItem={handleRemoveFromCart}
                  onCompleteOrder={handleCompleteOrderWithNavigation}
                />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
