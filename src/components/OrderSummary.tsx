
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Cart from '@/components/Cart';
import CustomerForm from '@/components/CustomerForm';
import PaymentForm from '@/components/PaymentForm';
import { CartItem, Customer } from '@/types';

interface OrderSummaryProps {
  cartItems: CartItem[];
  customer: Customer;
  paymentMethod: string;
  amountPaid: number;
  selectedDriver: string;
  orderTotal: number;
  canProceedToCheckout: boolean;
  isLoading: boolean;
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onCompleteOrder: () => void;
  onCustomerChange: (customer: Customer) => void;
  onPaymentMethodChange: (method: 'Bank Transfer' | 'POS') => void;
  onAmountPaidChange: (amount: number) => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartItems,
  customer,
  paymentMethod,
  amountPaid,
  orderTotal,
  canProceedToCheckout,
  isLoading,
  onUpdateQuantity,
  onRemoveItem,
  onCompleteOrder,
  onCustomerChange,
  onPaymentMethodChange,
  onAmountPaidChange
}) => {
  if (cartItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Add items to your cart to proceed with the order
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Cart 
        items={cartItems}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
      />
      
      <CustomerForm customer={customer} onChange={onCustomerChange} />
      
      <PaymentForm
        paymentMethod={paymentMethod}
        amountPaid={amountPaid}
        orderTotal={orderTotal}
        onPaymentMethodChange={onPaymentMethodChange}
        onAmountPaidChange={onAmountPaidChange}
      />
      
      <Button 
        onClick={onCompleteOrder}
        disabled={!canProceedToCheckout || isLoading}
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Complete Order'}
      </Button>
    </div>
  );
};

export default OrderSummary;
