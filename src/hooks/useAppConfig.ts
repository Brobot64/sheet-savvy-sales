
import { useState } from 'react';
import { AppConfig } from '@/types';
import { useToast } from '@/hooks/use-toast';

const getDefaultConfig = (): AppConfig => ({
  spreadsheetId: '1Ljddx01jdNdy7KPhO_8BCUMRmQ-iTznyA03DkJYOhMU',
  salesSheetGid: '311399969',
  priceSheetGid: '1324216461',
  paymentsSheetGid: '495567720',
  drivers: ['DEPOT BULK', 'ALABI MUSIBAU', 'LAWAL WILLIAMS'],
  companyName: 'Depot Sales Company',
  companyAddress: 'Warehouse 1 - A Load Out',
  companyPhone: '+234 XXX XXX XXXX',
  googleSheetsApiKey: '',
  loader1: 'Auto',
  loader2: 'Auto',
  submittedBy: 'Auto'
});

export const useAppConfig = () => {
  const { toast } = useToast();

  const [config, setConfig] = useState<AppConfig>(() => {
    // Load config from localStorage or use defaults
    try {
      const savedConfig = localStorage.getItem('app-config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        // Ensure all required fields exist by merging with defaults
        return { ...getDefaultConfig(), ...parsed };
      }
    } catch (error) {
      console.error('Error loading saved config:', error);
    }
    return getDefaultConfig();
  });

  const handleConfigSave = (newConfig: AppConfig) => {
    try {
      // Save to localStorage
      localStorage.setItem('app-config', JSON.stringify(newConfig));
      setConfig(newConfig);
      
      toast({
        title: "Configuration Saved",
        description: "Your settings have been saved successfully.",
      });
      
      return newConfig;
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save configuration.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    config,
    handleConfigSave
  };
};
