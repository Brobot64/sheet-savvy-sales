
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AppConfig } from '@/types';
import ConnectionTestCard from '@/components/settings/ConnectionTestCard';
import SheetsConfigCard from '@/components/settings/SheetsConfigCard';
import CompanyInfoCard from '@/components/settings/CompanyInfoCard';
import OperationsConfigCard from '@/components/settings/OperationsConfigCard';
import DriversCard from '@/components/settings/DriversCard';

interface SettingsProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave }) => {
  const [editedConfig, setEditedConfig] = useState<AppConfig>(config);
  const [isOpen, setIsOpen] = useState(false);

  // Update editedConfig when config prop changes
  useEffect(() => {
    setEditedConfig(config);
  }, [config]);

  const handleSave = () => {
    onSave(editedConfig);
    setIsOpen(false);
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
          <ConnectionTestCard config={editedConfig} />
          <SheetsConfigCard config={editedConfig} onConfigChange={setEditedConfig} />
          <CompanyInfoCard config={editedConfig} onConfigChange={setEditedConfig} />
          <OperationsConfigCard config={editedConfig} onConfigChange={setEditedConfig} />
          <DriversCard config={editedConfig} onConfigChange={setEditedConfig} />
          
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
