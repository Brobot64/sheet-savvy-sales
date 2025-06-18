
import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppConfig } from '@/types';

interface SettingsProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave }) => {
  const [editedConfig, setEditedConfig] = useState<AppConfig>(config);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    onSave(editedConfig);
    setIsOpen(false);
  };

  const addDriver = () => {
    setEditedConfig(prev => ({
      ...prev,
      drivers: [...prev.drivers, '']
    }));
  };

  const updateDriver = (index: number, value: string) => {
    setEditedConfig(prev => ({
      ...prev,
      drivers: prev.drivers.map((driver, i) => i === index ? value : driver)
    }));
  };

  const removeDriver = (index: number) => {
    setEditedConfig(prev => ({
      ...prev,
      drivers: prev.drivers.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>App Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Google Sheets Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Spreadsheet ID</Label>
                <Input
                  value={editedConfig.spreadsheetId}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    spreadsheetId: e.target.value
                  }))}
                  placeholder="Enter spreadsheet ID"
                />
              </div>
              
              <div>
                <Label>Sales Sheet GID</Label>
                <Input
                  value={editedConfig.salesSheetGid}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    salesSheetGid: e.target.value
                  }))}
                  placeholder="Enter sales sheet GID"
                />
              </div>
              
              <div>
                <Label>Price Sheet GID</Label>
                <Input
                  value={editedConfig.priceSheetGid}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    priceSheetGid: e.target.value
                  }))}
                  placeholder="Enter price sheet GID"
                />
              </div>
              
              <div>
                <Label>Payments Sheet GID</Label>
                <Input
                  value={editedConfig.paymentsSheetGid}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    paymentsSheetGid: e.target.value
                  }))}
                  placeholder="Enter payments sheet GID"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={editedConfig.companyName}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    companyName: e.target.value
                  }))}
                  placeholder="Enter company name"
                />
              </div>
              
              <div>
                <Label>Company Address</Label>
                <Input
                  value={editedConfig.companyAddress}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    companyAddress: e.target.value
                  }))}
                  placeholder="Enter company address"
                />
              </div>
              
              <div>
                <Label>Company Phone</Label>
                <Input
                  value={editedConfig.companyPhone}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    companyPhone: e.target.value
                  }))}
                  placeholder="Enter company phone"
                />
              </div>
            </CardContent>
          </Card>
          
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
              {editedConfig.drivers.map((driver, index) => (
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
                    disabled={editedConfig.drivers.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Settings;
