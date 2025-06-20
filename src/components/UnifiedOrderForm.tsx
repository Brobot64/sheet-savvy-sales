
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import DriverSelector from '@/components/DriverSelector';
import SKUCatalog from '@/components/SKUCatalog';
import { SKU, CartItem } from '@/types';

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
  getOrderTotal: () => number;
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
  getOrderTotal
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
    </div>
  );
};

export default UnifiedOrderForm;
