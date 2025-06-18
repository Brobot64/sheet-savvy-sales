
import { SKU, SalesRecord, PaymentRecord, AppConfig, Order } from '@/types';

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Google Sheets API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw error;
    }
  }

  async appendToSheet(spreadsheetId: string, range: string, values: any[][]): Promise<void> {
    if (!this.apiKey) {
      console.log('Google Sheets API key not configured. Would append to sheet:', { spreadsheetId, range, values });
      return;
    }

    // Note: Write operations require OAuth2 authentication
    // For production, you'd need to implement proper authentication
    console.log('Would append to sheet (write operations require OAuth2):', { spreadsheetId, range, values });
    
    // Simulate the write operation
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async getSKUData(config: AppConfig): Promise<SKU[]> {
    try {
      // Try to fetch real data if API key is configured
      if (this.apiKey) {
        console.log('Fetching SKU data from Google Sheets...');
        const range = `Price Data (Depot Only)!A:D`;
        const data = await this.fetchSheetData(config.spreadsheetId, range);
        
        if (data.length > 1) {
          // Skip header row and map to SKU objects
          const skus = data.slice(1).map((row, index) => ({
            id: `sku-${index + 1}`,
            name: row[0] || '',
            unitPrice: parseFloat(row[1]) || 0,
            packType: row[2] || '',
            packType2: row[3] || ''
          })).filter(sku => sku.name && sku.unitPrice > 0); // Filter out empty/invalid rows
          
          console.log(`Loaded ${skus.length} SKUs from Google Sheets`);
          return skus;
        }
      }
    } catch (error) {
      console.error('Error fetching SKU data from Google Sheets:', error);
      throw error;
    }

    // Fallback to local data
    console.log('Using fallback SKU data');
    return this.getFallbackSKUData();
  }

  private getFallbackSKUData(): SKU[] {
    return [
      { id: 'sku-1', name: '35cl RGB', unitPrice: 4400, packType: 'RGB 35cl', packType2: '35cl' },
      { id: 'sku-2', name: '35cl RGB - PROMO', unitPrice: 4400, packType: 'RGB 35cl', packType2: '35cl' },
      { id: 'sku-3', name: '35cl RGB Apple', unitPrice: 4400, packType: 'RGB 35cl', packType2: '35cl' },
      { id: 'sku-4', name: '30cl RGB SCHWEPPES BL', unitPrice: 4400, packType: 'RGB 35cl', packType2: '35cl' },
      { id: 'sku-5', name: '35cl RGB ZERO', unitPrice: 3200, packType: 'RGB 35cl', packType2: '35cl' },
      { id: 'sku-6', name: '35cl RGB Sprite', unitPrice: 4400, packType: 'RGB 35cl', packType2: '35cl' },
      { id: 'sku-7', name: '35cl RGB - limca', unitPrice: 4400, packType: 'RGB 35cl', packType2: '35cl' },
      { id: 'sku-8', name: '50cl RGB', unitPrice: 5800, packType: 'RGB 50cl', packType2: '50cl' },
      { id: 'sku-9', name: '50cl RGB Promo', unitPrice: 5800, packType: 'RGB 50cl', packType2: '50cl' },
      { id: 'sku-10', name: '50cl RGB Apple', unitPrice: 5800, packType: 'RGB 50cl', packType2: '50cl' },
      { id: 'sku-11', name: '50cl RGB Coke zero', unitPrice: 5800, packType: 'RGB 50cl', packType2: '50cl' },
      { id: 'sku-12', name: '50cl RGB Sprite', unitPrice: 5800, packType: 'RGB 50cl', packType2: '50cl' },
      { id: 'sku-13', name: '50cl RGB - limca', unitPrice: 5800, packType: 'RGB 50cl', packType2: '50cl' },
      { id: 'sku-14', name: 'PET -35CL', unitPrice: 3000, packType: 'PET 35cl', packType2: '35cl' },
      { id: 'sku-15', name: 'PET -50CL', unitPrice: 4400, packType: 'PET 50cl/60cl', packType2: '50cl/60cl' },
      { id: 'sku-16', name: 'PET -60CL', unitPrice: 4500, packType: 'PET 50cl/60cl', packType2: '50cl/60cl' },
      { id: 'sku-17', name: 'PET-60CL OTHERS', unitPrice: 3200, packType: 'PET 50cl/60cl', packType2: '50cl/60cl' },
      { id: 'sku-18', name: 'PET 60cl Coke zero', unitPrice: 3200, packType: 'PET 50cl/60cl', packType2: '50cl/60cl' },
      { id: 'sku-19', name: 'PET 60cl Fanta zero', unitPrice: 3200, packType: 'PET 50cl/60cl', packType2: '50cl/60cl' },
      { id: 'sku-20', name: 'PET 35cl Coke zero', unitPrice: 3200, packType: 'PET 35cl', packType2: '35cl' },
      { id: 'sku-21', name: 'PET 35cl ZERO OTHERS', unitPrice: 3200, packType: 'PET 35cl', packType2: '35cl' },
      { id: 'sku-22', name: 'PET SCHWEPPES 40CL', unitPrice: 4500, packType: 'PET 40cl', packType2: '40cl' },
      { id: 'sku-23', name: 'PET SCHWEPPES ZOBO 30CL', unitPrice: 3350, packType: 'PET 35cl', packType2: '35cl' },
      { id: 'sku-24', name: 'PET LIMCA 60CL', unitPrice: 3200, packType: 'PET 50cl/60cl', packType2: '50cl/60cl' },
      { id: 'sku-25', name: 'PET PREDATOR 400ML', unitPrice: 5200, packType: 'PET Energy 40cl', packType2: 'Energy 40cl' },
      { id: 'sku-26', name: 'PET PREDATOR MALT 400ML', unitPrice: 5200, packType: 'PET Energy 40cl', packType2: 'Energy 40cl' },
      { id: 'sku-27', name: 'PET PREDATOR GREEN 400ML', unitPrice: 5200, packType: 'PET Energy 40cl', packType2: 'Energy 40cl' },
      { id: 'sku-28', name: 'PET 1L', unitPrice: 6600, packType: 'PET 1L/1.5L', packType2: '1L/1.5L' },
      { id: 'sku-29', name: 'Five Alive 30cl PET', unitPrice: 4500, packType: 'FIVE ALIVE PET 35cl', packType2: '35cl' },
      { id: 'sku-30', name: 'Five Alive 30cl PET LEMON', unitPrice: 5500, packType: 'FIVE ALIVE PET 35cl', packType2: '35cl' },
      { id: 'sku-31', name: 'Five Alive 35cl PET', unitPrice: 5500, packType: 'FIVE ALIVE PET 35cl', packType2: '35cl' },
      { id: 'sku-32', name: 'Five Alive Tropical 35cl PET', unitPrice: 5500, packType: 'FIVE ALIVE PET 35cl', packType2: '35cl' },
      { id: 'sku-33', name: 'Five Alive 35cl PET Apple', unitPrice: 5500, packType: 'FIVE ALIVE PET 35cl', packType2: '35cl' },
      { id: 'sku-34', name: 'Five Alive 78cl PET', unitPrice: 6500, packType: 'FIVE ALIVE PET 78cl/85cl/90cl', packType2: '78cl/85cl/90cl' },
      { id: 'sku-35', name: 'Five Alive Pulpy 85cl PET', unitPrice: 6500, packType: 'FIVE ALIVE PET 78cl/85cl/90cl', packType2: '78cl/85cl/90cl' },
      { id: 'sku-36', name: 'Five Alive 90cl PET', unitPrice: 6500, packType: 'FIVE ALIVE PET 78cl/85cl/90cl', packType2: '78cl/85cl/90cl' },
      { id: 'sku-37', name: 'Five Alive Tropical 90cl PET', unitPrice: 6500, packType: 'FIVE ALIVE PET 78cl/85cl/90cl', packType2: '78cl/85cl/90cl' },
      { id: 'sku-38', name: 'Five Alive 85cl PET LEMON-PROMO', unitPrice: 6500, packType: 'FIVE ALIVE PET 78cl/85cl/90cl', packType2: '78cl/85cl/90cl' },
      { id: 'sku-39', name: 'Five Alive 85cl PET MANGO', unitPrice: 6500, packType: 'FIVE ALIVE PET 78cl/85cl/90cl', packType2: '78cl/85cl/90cl' },
      { id: 'sku-40', name: '50cl EVA', unitPrice: 1050, packType: 'EVA PET 50cl/75cl', packType2: '50cl/75cl' },
      { id: 'sku-41', name: '75cl EVA', unitPrice: 2800, packType: 'EVA PET 50cl/75cl', packType2: '50cl/75cl' },
      { id: 'sku-42', name: '150cl Eva', unitPrice: 3750, packType: 'EVA PET 150cl', packType2: '150cl' },
      { id: 'sku-43', name: 'Can 33cl SCHWEPPES', unitPrice: 10800, packType: 'CANS 33cl', packType2: '33cl' },
      { id: 'sku-44', name: 'Cans Czero, Fanta, Sprite', unitPrice: 10400, packType: 'CANS 33cl', packType2: '33cl' },
      { id: 'sku-45', name: 'Monster', unitPrice: 20500, packType: 'CANS 40cl', packType2: '40cl' },
      { id: 'sku-46', name: 'Monster ULTRA', unitPrice: 19000, packType: 'CANS 40cl', packType2: '40cl' },
      { id: 'sku-47', name: 'Crates', unitPrice: 600, packType: 'CRATES', packType2: 'CRATES' },
      { id: 'sku-48', name: 'Empties (50cl RGB + Crate)', unitPrice: 1900, packType: 'Empties 50cl RGB', packType2: 'RGB 50cl' },
      { id: 'sku-49', name: 'Empties (35cl RGB + Crate)', unitPrice: 1900, packType: 'Empties 35cl RGB', packType2: 'RGB 35cl' },
      { id: 'sku-50', name: 'Empties with Plastic', unitPrice: 1900, packType: 'Empties RGB RGB', packType2: 'Empties' },
      { id: 'sku-51', name: 'Empties Bottles Only', unitPrice: 1320, packType: 'Empties BOTTLES', packType2: 'BOTTLES' }
    ];
  }

  async writeSalesRecord(order: Order, config: AppConfig): Promise<void> {
    const salesRecords: any[][] = [];
    const currentDate = new Date();
    const timestamp = currentDate.toISOString();
    const transactionDate = currentDate.toLocaleDateString('en-GB');

    // Create a sales record for each line item
    order.items.forEach(item => {
      salesRecords.push([
        timestamp, // Timestamp
        transactionDate, // Transaction Date
        'Warehouse 1 - A', // Warehouse
        'Load Out', // Load Out/In
        item.sku.name, // SKU Name
        item.quantity, // SKU QTY
        item.sku.unitPrice, // SKU Price
        item.lineTotal, // Total Amount
        item.sku.packType, // Pack Type
        order.driver, // Driver-Seller
        'QUDUS ALLI', // Loader 1
        '', // Loader 2
        'Kundus', // Submitted By
        order.customer.name, // Customer Name
        order.customer.address, // Customer Address
        order.customer.phone, // Customer Phone
        order.paymentMethod, // Payment Method
        order.amountPaid, // Amount Paid
        order.balance // Balance
      ]);
    });

    console.log('Writing sales records:', salesRecords);
    await this.appendToSheet(config.spreadsheetId, 'Processed Data (Sales Depot Sales Only)!A:S', salesRecords);
  }

  async writePaymentRecord(order: Order, config: AppConfig): Promise<void> {
    const currentDate = new Date();
    const timestamp = currentDate.toISOString();
    const deliveryDate = currentDate.toLocaleDateString('en-GB');

    const paymentRecord = [
      timestamp, // Timestamp
      deliveryDate, // Delivery Date
      order.paymentMethod === 'Bank Transfer' ? 'STANBIC' : 'POS', // Bank
      'Warehouse 1 - A', // Warehouse
      order.driver, // Driver
      order.customer.name, // Customer Name
      order.amountPaid, // AMOUNT
      'Y', // USE NOW
      '', // FORWARDED DATE
      deliveryDate // NEW DATE
    ];

    console.log('Writing payment record:', paymentRecord);
    await this.appendToSheet(config.spreadsheetId, 'Processed Customer Bank Transfer (Depot Only)!A:J', [paymentRecord]);
  }

  async testConnection(config: AppConfig): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.apiKey) {
        return { success: false, message: 'API key not configured' };
      }

      // Test by trying to read the price sheet
      const range = `Price Data (Depot Only)!A1:D1`;
      await this.fetchSheetData(config.spreadsheetId, range);
      
      return { success: true, message: 'Successfully connected to Google Sheets' };
    } catch (error) {
      return { 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}
