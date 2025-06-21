
import { useState, useEffect } from 'react';
import { AppConfig } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [config, setConfig] = useState<AppConfig>(getDefaultConfig());
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadConfigFromSupabase(session.user.id);
      } else {
        // If no user, load from localStorage as fallback
        loadConfigFromLocalStorage();
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadConfigFromSupabase(session.user.id);
      } else {
        loadConfigFromLocalStorage();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadConfigFromSupabase = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('app_configs')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading config from Supabase:', error);
        loadConfigFromLocalStorage();
        return;
      }

      if (data) {
        const loadedConfig: AppConfig = {
          spreadsheetId: data.spreadsheet_id,
          salesSheetGid: data.sales_sheet_gid,
          priceSheetGid: data.price_sheet_gid,
          paymentsSheetGid: data.payments_sheet_gid,
          drivers: data.drivers || [],
          companyName: data.company_name,
          companyAddress: data.company_address,
          companyPhone: data.company_phone,
          googleSheetsApiKey: data.google_sheets_api_key || '',
          loader1: data.loader1,
          loader2: data.loader2,
          submittedBy: data.submitted_by
        };
        setConfig(loadedConfig);
      } else {
        // No config found, use defaults but try to migrate from localStorage
        const localConfig = loadConfigFromLocalStorage();
        if (localConfig) {
          // Migrate localStorage config to Supabase
          await saveConfigToSupabase(userId, localConfig);
        }
      }
    } catch (error) {
      console.error('Error loading config from Supabase:', error);
      loadConfigFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const loadConfigFromLocalStorage = () => {
    try {
      const savedConfig = localStorage.getItem('app-config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        const mergedConfig = { ...getDefaultConfig(), ...parsed };
        setConfig(mergedConfig);
        setIsLoading(false);
        return mergedConfig;
      }
    } catch (error) {
      console.error('Error loading saved config from localStorage:', error);
    }
    
    setConfig(getDefaultConfig());
    setIsLoading(false);
    return null;
  };

  const saveConfigToSupabase = async (userId: string, configToSave: AppConfig) => {
    try {
      const configData = {
        user_id: userId,
        spreadsheet_id: configToSave.spreadsheetId,
        sales_sheet_gid: configToSave.salesSheetGid,
        price_sheet_gid: configToSave.priceSheetGid,
        payments_sheet_gid: configToSave.paymentsSheetGid,
        drivers: configToSave.drivers,
        company_name: configToSave.companyName,
        company_address: configToSave.companyAddress,
        company_phone: configToSave.companyPhone,
        google_sheets_api_key: configToSave.googleSheetsApiKey || '',
        loader1: configToSave.loader1,
        loader2: configToSave.loader2,
        submitted_by: configToSave.submittedBy
      };

      // Try to update existing config first
      const { data: existingConfig } = await supabase
        .from('app_configs')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingConfig) {
        // Update existing config
        const { error } = await supabase
          .from('app_configs')
          .update(configData)
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        // Insert new config
        const { error } = await supabase
          .from('app_configs')
          .insert([configData]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving config to Supabase:', error);
      throw error;
    }
  };

  const handleConfigSave = async (newConfig: AppConfig) => {
    try {
      // Always save to localStorage as backup
      localStorage.setItem('app-config', JSON.stringify(newConfig));
      setConfig(newConfig);

      // If user is logged in, save to Supabase
      if (user) {
        await saveConfigToSupabase(user.id, newConfig);
      }
      
      toast({
        title: "Configuration Saved",
        description: user 
          ? "Your settings have been saved to your account." 
          : "Your settings have been saved locally. Sign in to save across devices.",
      });
      
      return newConfig;
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    config,
    handleConfigSave,
    isLoading,
    isAuthenticated: !!user
  };
};
