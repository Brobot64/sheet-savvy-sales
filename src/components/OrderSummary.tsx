
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Cart from '@/components/Cart';
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
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  cartItems,
  customer,
  paymentMethod,
  amountPaid,
  selectedDriver,
  orderTotal,
  canProceedToCheckout,
  isLoading,
  onUpdateQuantity,
  onRemoveItem,
  onCompleteOrder
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
      <Cart 
        items={cartItems}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
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
          <h3 className="font-semibold">Payment & Driver:</h3>
          <p className="text-sm">Payment Method: {paymentMethod || 'Not selected'}</p>
          <p className="text-sm">Amount: {formatCurrency(amountPaid)}</p>
          <p className="text-sm">
            Balance: {formatCurrency(Math.max(0, orderTotal - amountPaid))}
          </p>
          <p className="text-sm">Driver: {selectedDriver || 'Not selected'}</p>
        </CardContent>
      </Card>
      
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
