
import React from 'react';
import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Order, AppConfig } from '@/types';

interface ReceiptProps {
  order: Order;
  config: AppConfig;
  onShareWhatsApp: () => void;
}

const Receipt: React.FC<ReceiptProps> = ({ order, config, onShareWhatsApp }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
            Date: {order.timestamp.toLocaleDateString('en-GB')} {order.timestamp.toLocaleTimeString()}
          </p>
          <p className="text-sm text-gray-600">Driver: {order.driver}</p>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Customer Details:</h3>
          <p className="text-sm">{order.customer.name}</p>
          <p className="text-sm">{order.customer.address}</p>
          <p className="text-sm">{order.customer.phone}</p>
        </div>
        
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Items:</h3>
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 p-2">S/No</TableHead>
                <TableHead className="p-2">SKU</TableHead>
                <TableHead className="w-12 p-2 text-center">Qty</TableHead>
                <TableHead className="w-16 p-2 text-right">Unit Price</TableHead>
                <TableHead className="w-16 p-2 text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="p-2 font-medium">{index + 1}</TableCell>
                  <TableCell className="p-2">
                    <div className="font-medium">{item.sku.name}</div>
                    <div className="text-gray-600 text-xs">
                      {item.sku.packType} • {item.sku.packType2}
                    </div>
                  </TableCell>
                  <TableCell className="p-2 text-center">{item.quantity}</TableCell>
                  <TableCell className="p-2 text-right">{formatCurrency(item.sku.unitPrice)}</TableCell>
                  <TableCell className="p-2 text-right font-semibold">{formatCurrency(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between font-semibold">
            <span>Subtotal:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg">
            <span>Total:</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>
        
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Payment Method:</span>
            <span>{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span>{formatCurrency(order.amountPaid)}</span>
          </div>
          {order.balance > 0 && (
            <div className="flex justify-between text-red-600 font-semibold">
              <span>Balance Due:</span>
              <span>{formatCurrency(order.balance)}</span>
            </div>
          )}
          {order.balance === 0 && (
            <div className="flex justify-between text-green-600 font-semibold">
              <span>Status:</span>
              <span>PAID IN FULL</span>
            </div>
          )}
        </div>
        
        <div className="border-t pt-4 text-center">
          <p className="text-xs text-gray-500 mt-2">Thank you for your business!</p>
          <p className="text-xs text-gray-500">Warehouse 1 - A Load Out</p>
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
