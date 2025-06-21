
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppConfig } from '@/types';

interface OperationsConfigCardProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

const OperationsConfigCard: React.FC<OperationsConfigCardProps> = ({ config, onConfigChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Operations Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Default Loader 1</Label>
          <Input
            value={config.loader1}
            onChange={(e) => onConfigChange({
              ...config,
              loader1: e.target.value
            })}
            placeholder="Enter default loader 1 name"
          />
        </div>
        
        <div>
          <Label>Default Loader 2</Label>
          <Input
            value={config.loader2}
            onChange={(e) => onConfigChange({
              ...config,
              loader2: e.target.value
            })}
            placeholder="Enter default loader 2 name"
          />
        </div>
        
        <div>
          <Label>Default Submitted By</Label>
          <Input
            value={config.submittedBy}
            onChange={(e) => onConfigChange({
              ...config,
              submittedBy: e.target.value
            })}
            placeholder="Enter default submitted by name"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default OperationsConfigCard;
