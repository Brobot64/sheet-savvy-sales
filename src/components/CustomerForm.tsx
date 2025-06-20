
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer } from '@/types';

interface CustomerFormProps {
  customer: Customer;
  onChange: (customer: Customer) => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onChange }) => {
  const handleChange = (field: keyof Customer, value: string) => {
    onChange({
      ...customer,
      [field]: value
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Customer Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="customerName" className="flex items-center gap-1">
            Customer Name 
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="customerName"
            type="text"
            value={customer.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Enter customer name"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="customerAddress" className="flex items-center gap-1">
            Address
            <span className="text-gray-400 text-sm">(Optional)</span>
          </Label>
          <Input
            id="customerAddress"
            type="text"
            value={customer.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Enter customer address (optional)"
          />
        </div>
        
        <div>
          <Label htmlFor="customerPhone" className="flex items-center gap-1">
            Phone Number 
            <span className="text-red-500">*</span>
          </Label>
          <Input
            id="customerPhone"
            type="tel"
            value={customer.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Enter phone number"
            required
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerForm;
