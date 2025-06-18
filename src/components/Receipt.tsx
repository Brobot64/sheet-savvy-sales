
import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Order, AppConfig } from '@/types';

interface ReceiptProps {
  order: Order;
  config: AppConfig;
  onShareWhatsApp: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ order, config, onShareWhatsApp }) => {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center border-b">
        <CardTitle className="text-xl">{config.companyName}</CardTitle>
        <p className="text-sm text-gray-600">{config.companyAddress}</p>
        <p className="text-sm text-gray-600">{config.companyPhone}</p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-bold">SALES RECEIPT</h2>
          <p className="text-sm text-gray-600">Order ID: {order.id}</p>
          <p className="text-sm text-gray-600">
            Date: {order.timestamp.toLocaleDateString()} {order.timestamp.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Customer Details:</h3>
          <p className="text-sm">{order.customer.name}</p>
          <p className="text-sm">{order.customer.address}</p>
          <p className="text-sm">{order.customer.phone}</p>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Items:</h3>
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm mb-2">
              <div className="flex-1">
                <div>{item.sku.name}</div>
                <div className="text-gray-600">
                  {item.quantity} × ${item.sku.unitPrice.toFixed(2)}
                </div>
              </div>
              <div className="font-semibold">
                ${item.lineTotal.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between font-semibold">
            <span>Subtotal:</span>
            <span>${order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span>{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span>${order.amountPaid.toFixed(2)}</span>
          </div>
          {order.balance > 0 && (
            <div className="flex justify-between text-red-600 font-semibold">
              <span>Balance Due:</span>
              <span>${order.balance.toFixed(2)}</span>
            </div>
          )}
        </div>
        
        <div className="border-t pt-4 text-center">
          <p className="text-sm text-gray-600">Driver: {order.driver}</p>
          <p className="text-xs text-gray-500 mt-2">Thank you for your business!</p>
        </div>
        
        <Button 
          onClick={onShareWhatsApp}
          className="w-full mt-6"
          variant="outline"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share via WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
};

export default Receipt;
