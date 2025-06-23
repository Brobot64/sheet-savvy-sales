
import { useState, useEffect } from 'react';
import { AppConfig } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

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
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadConfigFromSupabase = async (userId: string) => {
    try {
      console.log('Loading config from Supabase for user:', userId);
      
      const { data, error } = await supabase
        .from('app_configs')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error loading config from Supabase:', error);
        toast({
          title: "Config Load Warning",
          description: "Failed to load saved settings from database. Using defaults.",
          variant: "destructive",
        });
        const localConfig = loadConfigFromLocalStorage();
        return localConfig;
      }

      if (data) {
        console.log('Config loaded from Supabase:', data);
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
        // Also save to localStorage as backup
        localStorage.setItem('app-config', JSON.stringify(loadedConfig));
        return loadedConfig;
      } else {
        console.log('No config found in Supabase, checking localStorage');
        // No config found, try to migrate from localStorage
        const localConfig = loadConfigFromLocalStorage();
        if (localConfig && JSON.stringify(localConfig) !== JSON.stringify(getDefaultConfig())) {
          console.log('Migrating localStorage config to Supabase');
          await saveConfigToSupabase(userId, localConfig);
        }
        return localConfig;
      }
    } catch (error) {
      console.error('Error loading config from Supabase:', error);
      toast({
        title: "Config Load Error",
        description: "Database connection failed. Using local settings.",
        variant: "destructive",
      });
      return loadConfigFromLocalStorage();
    }
  };

  const loadConfigFromLocalStorage = () => {
    try {
      const savedConfig = localStorage.getItem('app-config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        const mergedConfig = { ...getDefaultConfig(), ...parsed };
        console.log('Config loaded from localStorage:', mergedConfig);
        setConfig(mergedConfig);
        return mergedConfig;
      }
    } catch (error) {
      console.error('Error loading saved config from localStorage:', error);
    }
    
    console.log('Using default config');
    const defaultConfig = getDefaultConfig();
    setConfig(defaultConfig);
    return defaultConfig;
  };

  const saveConfigToSupabase = async (userId: string, configToSave: AppConfig) => {
    try {
      console.log('Saving config to Supabase for user:', userId, configToSave);
      
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
        console.log('Updating existing config:', existingConfig.id);
        const { error } = await supabase
          .from('app_configs')
          .update(configData)
          .eq('id', existingConfig.id);

        if (error) throw error;
      } else {
        console.log('Creating new config');
        const { error } = await supabase
          .from('app_configs')
          .insert([configData]);

        if (error) throw error;
      }
      
      console.log('Config saved successfully to Supabase');
    } catch (error) {
      console.error('Error saving config to Supabase:', error);
      throw error;
    }
  };

  // Initialize auth state and config loading
  useEffect(() => {
    let mounted = true;
    let configLoaded = false;

    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }

        if (!mounted) return;

        if (session?.user) {
          console.log('Initial session found, user:', session.user.id);
          setUser(session.user);
          await loadConfigFromSupabase(session.user.id);
          configLoaded = true;
        } else {
          console.log('No initial session, loading from localStorage');
          setUser(null);
          loadConfigFromLocalStorage();
          configLoaded = true;
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
          loadConfigFromLocalStorage();
          configLoaded = true;
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (!mounted) return;

      // Only handle auth changes after initial load
      if (!configLoaded) return;

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        // Only reload config on sign in, not on token refresh
        if (event === 'SIGNED_IN') {
          setIsLoading(true);
          try {
            await loadConfigFromSupabase(session.user.id);
          } finally {
            setIsLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        // Load from localStorage when user logs out
        loadConfigFromLocalStorage();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Just update user state on token refresh, don't reload config
        setUser(session.user);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleConfigSave = async (newConfig: AppConfig) => {
    try {
      console.log('Saving config:', newConfig);
      
      // Always save to localStorage as backup
      localStorage.setItem('app-config', JSON.stringify(newConfig));
      setConfig(newConfig);

      // If user is logged in, save to Supabase
      if (user) {
        await saveConfigToSupabase(user.id, newConfig);
        toast({
          title: "Configuration Saved",
          description: "Your settings have been saved to your account and will sync across devices.",
        });
      } else {
        toast({
          title: "Configuration Saved Locally",
          description: "Settings saved locally. Sign in to save across devices.",
        });
      }
      
      return newConfig;
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save configuration to database. Settings saved locally only.",
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
