
// Google Sheets API service
export class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  private apiKey: string = '';
  
  static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchSheetData(spreadsheetId: string, range: string): Promise<any[][]> {
    if (!this.apiKey) {
      throw new Error('Google Sheets API key not configured');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw error;
    }
  }

  async appendToSheet(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    // Note: This would typically require OAuth2 authentication for write operations
    // For now, this is a placeholder that logs the data that would be written
    console.log('Would append to sheet:', { spreadsheetId, range, values });
    
    // In a real implementation, you'd use the Google Sheets API with proper authentication
    // This might involve server-side code or OAuth2 flow
  }

  async getSKUData(config: any): Promise<any[]> {
    const range = `gid=${config.priceSheetGid}`;
    const data = await this.fetchSheetData(config.spreadsheetId, range);
    
    // Skip header row and map to SKU objects
    return data.slice(1).map((row, index) => ({
      id: `sku-${index}`,
      name: row[0] || '',
      unitPrice: parseFloat(row[1]) || 0,
      packType: row[2] || '',
      packType2: row[3] || ''
    }));
  }
}
