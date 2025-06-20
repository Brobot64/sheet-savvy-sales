
import React from 'react';
import { User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DriverSelectorProps {
  drivers: string[];
  selectedDriver: string;
  onDriverChange: (driver: string) => void;
}

const DriverSelector: React.FC<DriverSelectorProps> = ({
  drivers,
  selectedDriver,
  onDriverChange
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-5 w-5" />
          Select Driver
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Select value={selectedDriver} onValueChange={onDriverChange}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a driver" />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((driver) => (
              <SelectItem key={driver} value={driver}>
                {driver}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};

export default DriverSelector;
