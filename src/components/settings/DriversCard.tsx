
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppConfig } from '@/types';

interface DriversCardProps {
  config: AppConfig;
  onConfigChange: (config: AppConfig) => void;
}

const DriversCard: React.FC<DriversCardProps> = ({ config, onConfigChange }) => {
  const addDriver = () => {
    onConfigChange({
      ...config,
      drivers: [...config.drivers, '']
    });
  };

  const updateDriver = (index: number, value: string) => {
    onConfigChange({
      ...config,
      drivers: config.drivers.map((driver, i) => i === index ? value : driver)
    });
  };

  const removeDriver = (index: number) => {
    onConfigChange({
      ...config,
      drivers: config.drivers.filter((_, i) => i !== index)
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          Drivers
          <Button onClick={addDriver} size="sm" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {config.drivers.map((driver, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Input
              value={driver}
              onChange={(e) => updateDriver(index, e.target.value)}
              placeholder="Driver name"
              className="flex-1"
            />
            <Button
              onClick={() => removeDriver(index)}
              size="sm"
              variant="outline"
              disabled={config.drivers.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default DriversCard;
