
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
      sku.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sku.packType.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="space-y-4">
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

      <div className="grid grid-cols-1 gap-2 max-h-[70vh] overflow-y-auto">
        {filteredSkus.map((sku) => (
          <Card key={sku.id} className="border border-gray-200">
            <CardContent className="p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{sku.name}</h3>
                  <p className="text-gray-600 text-xs">{sku.packType}</p>
                  {sku.packType2 && (
                    <p className="text-gray-500 text-xs">{sku.packType2}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-green-600 text-sm">
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
                  className="w-16 text-center h-8 text-sm"
                />
                <Button
                  onClick={() => handleAddToCart(sku)}
                  disabled={!quantities[sku.id] || quantities[sku.id] <= 0}
                  className="flex-1 h-8 text-xs"
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
