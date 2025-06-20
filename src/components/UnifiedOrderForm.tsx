
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DriverSelector from '@/components/DriverSelector';
import SKUCatalog from '@/components/SKUCatalog';
import Cart from '@/components/Cart';
import CustomerForm from '@/components/CustomerForm';
import PaymentForm from '@/components/PaymentForm';
import { SKU, CartItem, Customer } from '@/types';

interface UnifiedOrderFormProps {
  // Driver and date props
  drivers: string[];
  selectedDriver: string;
  onDriverChange: (driver: string) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  
  // SKU catalog props
  skus: SKU[];
  onAddToCart: (item: CartItem) => void;
  isLoadingSKUs: boolean;
  
  // Cart props
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveFromCart: (index: number) => void;
  getOrderTotal: () => number;
  
  // Customer props
  customer: Customer;
  onCustomerChange: (customer: Customer) => void;
  
  // Payment props
  paymentMethod: 'Bank Transfer' | 'POS' | '';
  amountPaid: number;
  onPaymentMethodChange: (method: 'Bank Transfer' | 'POS') => void;
  onAmountPaidChange: (amount: number) => void;
}

const UnifiedOrderForm: React.FC<UnifiedOrderFormProps> = ({
  drivers,
  selectedDriver,
  onDriverChange,
  selectedDate,
  onDateChange,
  skus,
  onAddToCart,
  isLoadingSKUs,
  cartItems,
  onUpdateQuantity,
  onRemoveFromCart,
  getOrderTotal,
  customer,
  onCustomerChange,
  paymentMethod,
  amountPaid,
  onPaymentMethodChange,
  onAmountPaidChange
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <DriverSelector 
        drivers={drivers}
        selectedDriver={selectedDriver}
        onDriverChange={onDriverChange}
        selectedDate={selectedDate}
        onDateChange={onDateChange}
      />
      
      <SKUCatalog 
        skus={skus} 
        onAddToCart={onAddToCart}
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
                {formatCurrency(getOrderTotal())}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {cartItems.length > 0 && (
        <>
          <Cart 
            items={cartItems}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveFromCart}
          />
          
          <CustomerForm customer={customer} onChange={onCustomerChange} />
          
          <PaymentForm
            paymentMethod={paymentMethod}
            amountPaid={amountPaid}
            orderTotal={getOrderTotal()}
            onPaymentMethodChange={onPaymentMethodChange}
            onAmountPaidChange={onAmountPaidChange}
          />
        </>
      )}
    </div>
  );
};

export default UnifiedOrderForm;
