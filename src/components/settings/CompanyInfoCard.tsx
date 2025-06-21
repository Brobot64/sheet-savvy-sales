
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppConfig } from '@/types';

interface CompanyInfoCardProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

const CompanyInfoCard: React.FC<CompanyInfoCardProps> = ({ config, onConfigChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Company Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Company Name</Label>
          <Input
            value={config.companyName}
            onChange={(e) => onConfigChange({
              ...config,
              companyName: e.target.value
            })}
            placeholder="Enter company name"
          />
        </div>
        
        <div>
          <Label>Company Address</Label>
          <Input
            value={config.companyAddress}
            onChange={(e) => onConfigChange({
              ...config,
              companyAddress: e.target.value
            })}
            placeholder="Enter company address"
          />
        </div>
        
        <div>
          <Label>Company Phone</Label>
          <Input
            value={config.companyPhone}
            onChange={(e) => onConfigChange({
              ...config,
              companyPhone: e.target.value
            })}
            placeholder="Enter company phone"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyInfoCard;
