
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppConfig } from '@/types';

interface SheetsConfigCardProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

const SheetsConfigCard: React.FC<SheetsConfigCardProps> = ({ config, onConfigChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Google Sheets Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Spreadsheet ID</Label>
          <Input
            value={config.spreadsheetId}
            onChange={(e) => onConfigChange({
              ...config,
              spreadsheetId: e.target.value
            })}
            placeholder="Enter spreadsheet ID"
          />
        </div>
        
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-800">
            <strong>Required Sheet Names:</strong><br/>
            • PriceData - for product pricing<br/>
            • Processed Data Sales - for sales records<br/>
            • Processed Customer Bank Transfer - for payment records<br/>
            Make sure these sheets exist in your spreadsheet.
          </AlertDescription>
        </Alert>
        
        <div>
          <Label>Sales Sheet GID</Label>
          <Input
            value={config.salesSheetGid}
            onChange={(e) => onConfigChange({
              ...config,
              salesSheetGid: e.target.value
            })}
            placeholder="Enter sales sheet GID (for Processed Data Sales)"
          />
        </div>
        
        <div>
          <Label>Price Sheet GID</Label>
          <Input
            value={config.priceSheetGid}
            onChange={(e) => onConfigChange({
              ...config,
              priceSheetGid: e.target.value
            })}
            placeholder="Enter price sheet GID (for PriceData)"
          />
        </div>
        
        <div>
          <Label>Payments Sheet GID</Label>
          <Input
            value={config.paymentsSheetGid}
            onChange={(e) => onConfigChange({
              ...config,
              paymentsSheetGid: e.target.value
            })}
            placeholder="Enter payments sheet GID (for Processed Customer Bank Transfer)"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SheetsConfigCard;
