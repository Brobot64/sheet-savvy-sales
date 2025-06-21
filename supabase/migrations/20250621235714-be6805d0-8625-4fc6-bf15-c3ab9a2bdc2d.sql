
-- Create a table for app configurations
CREATE TABLE public.app_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  spreadsheet_id TEXT NOT NULL,
  sales_sheet_gid TEXT NOT NULL,
  price_sheet_gid TEXT NOT NULL,
  payments_sheet_gid TEXT NOT NULL,
  drivers TEXT[] NOT NULL DEFAULT '{}',
  company_name TEXT NOT NULL,
  company_address TEXT NOT NULL,
  company_phone TEXT NOT NULL,
  google_sheets_api_key TEXT DEFAULT '',
  loader1 TEXT NOT NULL DEFAULT 'Auto',
  loader2 TEXT NOT NULL DEFAULT 'Auto',
  submitted_by TEXT NOT NULL DEFAULT 'Auto',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.app_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for app_configs
CREATE POLICY "Users can view their own app config" 
  ON public.app_configs 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own app config" 
  ON public.app_configs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own app config" 
  ON public.app_configs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own app config" 
  ON public.app_configs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_configs_updated_at 
    BEFORE UPDATE ON public.app_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
