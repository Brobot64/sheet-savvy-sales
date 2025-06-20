import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import UnifiedOrderForm from '@/components/UnifiedOrderForm';
import Receipt from '@/components/Receipt';
import Settings from '@/components/Settings';
import OrderSummary from '@/components/OrderSummary';

import { SKU, AppConfig } from '@/types';
import { GoogleSheetsService } from '@/services/googleSheets';
import { useOrderManagement } from '@/hooks/useOrderManagement';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('order');
  const [skus, setSKUs] = useState<SKU[]>([]);
  const [isLoadingSKUs, setIsLoadingSKUs] = useState(false);
  
  const getDefaultConfig = (): AppConfig => ({
    spreadsheetId: '1Ljddx01jdNdy7KPhO_8BCUMRmQ-iTznyA03DkJYOhMU',
    salesSheetGid: '311399969',
    priceSheetGid: '1324216461',
    paymentsSheetGid: '495567720',
    drivers: ['DEPOT BULK', 'ALABI MUSIBAU', 'LAWAL WILLIAMS'],
    companyName: 'Depot Sales Company',
    companyAddress: 'Warehouse 1 - A Load Out',
    companyPhone: '+234 XXX XXX XXXX',
    googleSheetsApiKey: '',
    loader1: 'Auto',
    loader2: 'Auto',
    submittedBy: 'Auto'
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    // Load config from localStorage or use defaults
    try {
      const savedConfig = localStorage.getItem('app-config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        // Ensure all required fields exist by merging with defaults
        return { ...getDefaultConfig(), ...parsed };
      }
    } catch (error) {
      console.error('Error loading saved config:', error);
    }
    return getDefaultConfig();
  });

  const handleConfigSave = (newConfig: AppConfig) => {
    try {
      // Save to localStorage
      localStorage.setItem('app-config', JSON.stringify(newConfig));
      setConfig(newConfig);
      
      toast({
        title: "Configuration Saved",
        description: "Your settings have been saved successfully.",
      });
      
      // Reload SKU data with new config
      loadSKUData(newConfig);
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save configuration.",
        variant: "destructive",
      });
    }
  };

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
  }, []);

  const loadSKUData = async (configToUse?: AppConfig) => {
    const activeConfig = configToUse || config;
    setIsLoadingSKUs(true);
    try {
      const skuData = await sheetsService.getSKUData(activeConfig);
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
      
      const fallbackSKUs = await sheetsService.getSKUData(activeConfig);
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
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">GrandPro Sales App</h1>
          <Settings config={config} onSave={handleConfigSave} />
        </div>

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
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="order" className="flex flex-col gap-1">
                  <div className="bg-white text-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                  <span className="text-xs">Order</span>
                </TabsTrigger>
                <TabsTrigger value="summary" className="flex flex-col gap-1">
                  <div className="bg-white text-purple-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                  <span className="text-xs">Summary</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="order" className="space-y-4">
                <UnifiedOrderForm
                  drivers={config.drivers}
                  selectedDriver={selectedDriver}
                  onDriverChange={setSelectedDriver}
                  selectedDate={transactionDate}
                  onDateChange={setTransactionDate}
                  skus={skus}
                  onAddToCart={handleAddToCart}
                  isLoadingSKUs={isLoadingSKUs}
                  cartItems={cartItems}
                  getOrderTotal={getOrderTotal}
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
                  onCustomerChange={setCustomer}
                  onPaymentMethodChange={setPaymentMethod}
                  onAmountPaidChange={setAmountPaid}
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
