
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PaymentFormProps {
  paymentMethod: 'Bank Transfer' | 'POS' | '';
  amountPaid: number;
  orderTotal: number;
  onPaymentMethodChange: (method: 'Bank Transfer' | 'POS') => void;
  onAmountPaidChange: (amount: number) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  paymentMethod,
  amountPaid,
  orderTotal,
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

  const balance = Math.max(0, orderTotal - amountPaid);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Payment Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Payment Method *</Label>
          <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="POS">POS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="amountPaid">Amount Paid (Optional)</Label>
          <Input
            id="amountPaid"
            type="number"
            step="0.01"
            min="0"
            max={orderTotal}
            value={amountPaid || ''}
            onChange={(e) => onAmountPaidChange(parseFloat(e.target.value) || 0)}
            placeholder="Leave empty to use order total"
          />
          <p className="text-xs text-gray-500 mt-1">
            If left empty, the full order amount will be used
          </p>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span>Order Total:</span>
            <span className="font-semibold">{formatCurrency(orderTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span className="font-semibold">{formatCurrency(amountPaid || orderTotal)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="font-bold">Balance Due:</span>
            <span className={`font-bold ${(amountPaid ? balance : 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(amountPaid ? balance : 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;
