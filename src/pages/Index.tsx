
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import UnifiedOrderForm from '@/components/UnifiedOrderForm';
import Receipt from '@/components/Receipt';
import Settings from '@/components/Settings';
import OrderSummary from '@/components/OrderSummary';
import AuthDialog from '@/components/AuthDialog';

import { useOrderManagement } from '@/hooks/useOrderManagement';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useSKUManagement } from '@/hooks/useSKUManagement';
import { useWhatsAppShare } from '@/components/WhatsAppShare';

const Index = () => {
  const [activeTab, setActiveTab] = useState('order');
  const [authKey, setAuthKey] = useState(0); // Force re-render on auth changes
  const { config, handleConfigSave, isLoading: isConfigLoading, isAuthenticated } = useAppConfig();
  const { skus, isLoadingSKUs, loadSKUData } = useSKUManagement();
  const { handleShareWhatsApp } = useWhatsAppShare();

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

  useEffect(() => {
    if (!isConfigLoading) {
      loadSKUData(config);
    }
  }, [config, isConfigLoading]);

  const handleConfigSaveWithReload = async (newConfig: any) => {
    try {
      const savedConfig = await handleConfigSave(newConfig);
      // Reload SKU data with new config
      await loadSKUData(savedConfig);
    } catch (error) {
      // Error handling is done in the hook
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

  const handleShareOrder = () => {
    if (currentOrder) {
      handleShareWhatsApp(currentOrder, config);
    }
  };

  const handleAuthChange = () => {
    setAuthKey(prev => prev + 1); // Force re-render to refresh config
  };

  if (isConfigLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">GrandPro Sales App</h1>
          <div className="flex items-center gap-2">
            <AuthDialog user={isAuthenticated} onAuthChange={handleAuthChange} />
            <Settings config={config} onSave={handleConfigSaveWithReload} />
          </div>
        </div>

        <div className="p-4">
          {!isAuthenticated && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Sign in to sync your settings</strong> across devices and ensure your configuration is always saved.
              </p>
            </div>
          )}

          {currentOrder ? (
            <div className="space-y-4">
              <Receipt 
                order={currentOrder} 
                config={config} 
                onShareWhatsApp={handleShareOrder}
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
