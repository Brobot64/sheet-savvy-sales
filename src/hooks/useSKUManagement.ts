
import { useState, useEffect } from 'react';
import { SKU, AppConfig } from '@/types';
import { GoogleSheetsService } from '@/services/googleSheets';
import { useToast } from '@/hooks/use-toast';

export const useSKUManagement = () => {
  const { toast } = useToast();
  const [skus, setSKUs] = useState<SKU[]>([]);
  const [isLoadingSKUs, setIsLoadingSKUs] = useState(false);
  const sheetsService = GoogleSheetsService.getInstance();

  const loadSKUData = async (config: AppConfig) => {
    setIsLoadingSKUs(true);
    try {
      const skuData = await sheetsService.getSKUData(config);
      setSKUs(skuData);
      
      toast({
        title: "SKU Data Loaded",
        description: `${skuData.length} products loaded from catalog.`,
      });
    } catch (error) {
      console.error('Error loading SKU data:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load product catalog. Using offline data.",
        variant: "destructive",
      });
      
      const fallbackSKUs = await sheetsService.getSKUData(config);
      setSKUs(fallbackSKUs);
    } finally {
      setIsLoadingSKUs(false);
    }
  };

  return {
    skus,
    isLoadingSKUs,
    loadSKUData
  };
};
