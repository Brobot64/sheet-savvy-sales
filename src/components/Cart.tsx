
import React from 'react';
import { Trash2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CartItem } from '@/types';

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
}

const Cart: React.FC<CartProps> = ({ items, onUpdateQuantity, onRemoveItem }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const total = items.reduce((sum, item) => sum + item.lineTotal, 0);

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          Your cart is empty
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cart ({items.length} items)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{item.sku.name}</h4>
              <p className="text-xs text-gray-600">{formatCurrency(item.sku.unitPrice)} each</p>
            </div>
            
            <div className="flex items-center space-x-1.5 ml-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="h-6 w-6 p-0"
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <span className="w-6 text-center font-medium text-xs">{item.quantity}</span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemoveItem(index)}
                className="h-6 w-6 p-0 ml-1"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="ml-2 font-bold text-green-600 text-sm min-w-[70px] text-right">
              {formatCurrency(item.lineTotal)}
            </div>
          </div>
        ))}
        
        <div className="border-t pt-3">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total:</span>
            <span className="text-green-600">{formatCurrency(total)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Cart;
