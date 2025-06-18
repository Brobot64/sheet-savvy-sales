
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
          <Label htmlFor="customerName">Customer Name *</Label>
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
          <Label htmlFor="customerAddress">Address *</Label>
          <Input
            id="customerAddress"
            type="text"
            value={customer.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Enter customer address"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="customerPhone">Phone Number *</Label>
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
