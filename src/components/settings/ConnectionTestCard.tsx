
import React, { useState } from 'react';
import { TestTube, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppConfig } from '@/types';
import { GoogleSheetsService } from '@/services/googleSheets';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionTestCardProps {
  config: AppConfig;
}

const ConnectionTestCard: React.FC<ConnectionTestCardProps> = ({ config }) => {
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingGid, setIsTestingGid] = useState(false);
  const [gidTestResult, setGidTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const testConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    
    const sheetsService = GoogleSheetsService.getInstance();
    const result = await sheetsService.testConnection(config);
    setTestResult(result);
    setIsTestingConnection(false);
  };

  const testGidConnection = async () => {
    setIsTestingGid(true);
    setGidTestResult(null);
    
    try {
      console.log('Testing GID connection with user config...');
      const { data, error } = await supabase.functions.invoke('google-sheets-test', {
        body: {
          spreadsheetId: config.spreadsheetId,
          priceSheetGid: config.priceSheetGid
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setGidTestResult({
        success: data.success,
        message: data.message || 'GID test completed',
        details: data
      });
    } catch (error) {
      setGidTestResult({
        success: false,
        message: `GID test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsTestingGid(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Google Sheets Integration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Secure authentication enabled via Supabase Edge Functions. Configure your Google Service Account credentials in Supabase secrets.
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2">
          <Button 
            onClick={testConnection}
            disabled={isTestingConnection}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <TestTube className="h-4 w-4 mr-1" />
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </Button>
          
          <Button 
            onClick={testGidConnection}
            disabled={isTestingGid}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <TestTube className="h-4 w-4 mr-1" />
            {isTestingGid ? 'Testing...' : 'Test GID'}
          </Button>
        </div>
        
        {testResult && (
          <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
              {testResult.message}
            </AlertDescription>
          </Alert>
        )}
        
        {gidTestResult && (
          <Alert className={gidTestResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {gidTestResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={gidTestResult.success ? 'text-green-800' : 'text-red-800'}>
              <div>{gidTestResult.message}</div>
              {gidTestResult.details && gidTestResult.success && (
                <div className="text-xs mt-1">
                  Rows found: {gidTestResult.details.rowCount}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionTestCard;
