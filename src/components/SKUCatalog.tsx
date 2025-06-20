
import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { SKU, CartItem } from '@/types';

interface SKUCatalogProps {
  skus: SKU[];
  onAddToCart: (item: CartItem) => void;
  isLoading: boolean;
}

const SKUCatalog: React.FC<SKUCatalogProps> = ({ skus, onAddToCart, isLoading }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [filteredSkus, setFilteredSkus] = useState<SKU[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const filtered = skus.filter(sku =>
      sku.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSkus(filtered);
  }, [skus, searchTerm]);

  const handleQuantityChange = (skuId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [skuId]: Math.max(0, quantity)
    }));
  };

  const handleAddToCart = (sku: SKU) => {
    const quantity = quantities[sku.id] || 1;
    const cartItem: CartItem = {
      sku,
      quantity,
      lineTotal: sku.unitPrice * quantity
    };
    onAddToCart(cartItem);
    
    // Reset quantity after adding
    setQuantities(prev => ({
      ...prev,
      [sku.id]: 0
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading SKU catalog...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="text"
          placeholder="Search SKUs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 gap-1.5 max-h-[75vh] overflow-y-auto">
        {filteredSkus.map((sku) => (
          <Card key={sku.id} className="border border-gray-200">
            <CardContent className="p-2.5">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{sku.name}</h3>
                </div>
                <div className="text-right ml-2">
                  <span className="font-bold text-green-600 text-sm whitespace-nowrap">
                    {formatCurrency(sku.unitPrice)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  value={quantities[sku.id] || ''}
                  onChange={(e) => handleQuantityChange(sku.id, parseInt(e.target.value) || 0)}
                  placeholder="Qty"
                  className="w-14 text-center h-7 text-xs"
                />
                <Button
                  onClick={() => handleAddToCart(sku)}
                  disabled={!quantities[sku.id] || quantities[sku.id] <= 0}
                  className="flex-1 h-7 text-xs px-2"
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SKUCatalog;
