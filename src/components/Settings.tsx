
import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Plus, Trash2, TestTube, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppConfig } from '@/types';
import { GoogleSheetsService } from '@/services/googleSheets';
import { supabase } from '@/integrations/supabase/client';

interface SettingsProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave }) => {
  const [editedConfig, setEditedConfig] = useState<AppConfig>(config);
  const [isOpen, setIsOpen] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingGid, setIsTestingGid] = useState(false);
  const [gidTestResult, setGidTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

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

  const testConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    
    const sheetsService = GoogleSheetsService.getInstance();
    const result = await sheetsService.testConnection(editedConfig);
    setTestResult(result);
    setIsTestingConnection(false);
  };

  const testGidConnection = async () => {
    setIsTestingGid(true);
    setGidTestResult(null);
    
    try {
      console.log('Testing GID connection...');
      const { data, error } = await supabase.functions.invoke('google-sheets-test', {
        body: {}
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
              
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertDescription className="text-yellow-800">
                  <strong>Required Sheet Names:</strong><br/>
                  • PriceData - for product pricing<br/>
                  • SalesData - for sales records<br/>
                  • PaymentData - for payment records<br/>
                  Sheet names should not contain spaces or special characters.
                </AlertDescription>
              </Alert>
              
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
              <CardTitle className="text-base">Operations Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Default Loader 1</Label>
                <Input
                  value={editedConfig.loader1}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    loader1: e.target.value
                  }))}
                  placeholder="Enter default loader 1 name"
                />
              </div>
              
              <div>
                <Label>Default Loader 2</Label>
                <Input
                  value={editedConfig.loader2}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    loader2: e.target.value
                  }))}
                  placeholder="Enter default loader 2 name"
                />
              </div>
              
              <div>
                <Label>Default Submitted By</Label>
                <Input
                  value={editedConfig.submittedBy}
                  onChange={(e) => setEditedConfig(prev => ({
                    ...prev,
                    submittedBy: e.target.value
                  }))}
                  placeholder="Enter default submitted by name"
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
