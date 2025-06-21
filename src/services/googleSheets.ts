import { SKU, SalesRecord, PaymentRecord, AppConfig, Order } from '@/types';
import { supabase } from '@/integrations/supabase/client';

// Google Sheets API service
export class GoogleSheetsService {
  private static instance: GoogleSheetsService;
  
  static getInstance(): GoogleSheetsService {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  setApiKey(apiKey: string) {
    // No longer needed - using Edge Functions
    console.log('API key setting is deprecated. Using Supabase Edge Functions for secure authentication.');
  }

  // Helper method to properly encode sheet ranges for Google Sheets API
  private encodeSheetRange(sheetName: string, range: string): string {
    // Encode sheet name if it contains spaces or special characters
    const encodedSheetName = sheetName.includes(' ') ? `'${sheetName}'` : sheetName;
    return `${encodedSheetName}!${range}`;
  }

  async fetchSheetData(spreadsheetId: string, range: string, gid?: string): Promise<any[][]> {
    try {
      console.log('Fetching sheet data via Supabase Edge Function...');
      
      const { data, error } = await supabase.functions.invoke('google-sheets-read', {
        body: { spreadsheetId, range, gid }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (data?.error) {
        console.error('Google Sheets API error:', data.error);
        throw new Error(data.error);
      }

      return data?.values || [];
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      throw error;
    }
  }

  async appendToSheet(spreadsheetId: string, range: string, values: any[][], gid?: string): Promise<void> {
    try {
      console.log('Writing to sheet via Supabase Edge Function...', {
        spreadsheetId,
        range,
        gid,
        rowCount: values.length,
        sampleData: values[0]
      });
      
      const { data, error } = await supabase.functions.invoke('google-sheets-write', {
        body: { 
          spreadsheetId, 
          range, 
          values: values.map(row => row.map(cell => cell === null || cell === undefined ? '' : String(cell))), 
          gid 
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Failed to write to sheet: ${error.message}`);
      }

      if (data?.error) {
        console.error('Google Sheets write error:', data.error);
        // Check for specific protection error
        if (data.error.includes('protected cell or object')) {
          throw new Error('SHEET_PROTECTED: The Google Sheet has protected cells that prevent writing. Please contact the sheet owner to remove protection or grant edit access to the service account.');
        }
        throw new Error(`Google Sheets error: ${data.error}`);
      }

      console.log(`Successfully wrote ${data?.updatedRows || values.length} rows to sheet`);
    } catch (error) {
      console.error('Error writing to sheet:', error);
      throw error;
    }
  }

  async getSKUData(config: AppConfig): Promise<SKU[]> {
    try {
      console.log('Fetching SKU data from Google Sheets using GID...');
      // Use GID instead of range to avoid parsing issues
      const data = await this.fetchSheetData(
        config.spreadsheetId, 
        'PriceData!A:D', 
        config.priceSheetGid
      );
      
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
    } catch (error) {
      console.error('Error fetching SKU data from Google Sheets:', error);
      console.log('Using fallback SKU data');
      return this.getFallbackSKUData();
    }

    // Fallback to local data
    console.log('Using fallback SKU data');
    return this.getFallbackSKUData();
  }

  async writeSalesRecord(order: Order, config: AppConfig): Promise<void> {
    const salesRecords: any[][] = [];
    const currentDate = new Date();
    const timestamp = currentDate.toISOString();
    const transactionDate = currentDate.toLocaleDateString('en-GB');

    // Create a sales record for each line item
    order.items.forEach(item => {
      const record = [
        timestamp, // Timestamp
        transactionDate, // Transaction Date
        'Warehouse 1 - A', // Warehouse
        'Load Out', // Load Out/In
        item.sku.name || '', // SKU Name
        item.quantity || 0, // SKU QTY
        item.sku.unitPrice || 0, // SKU Price
        item.lineTotal || 0, // Total Amount
        item.sku.packType || '', // Pack Type
        order.driver || config.drivers[0] || 'DEPOT BULK', // Driver-Seller
        config.loader1 || 'Auto', // Loader 1
        config.loader2 || 'Auto', // Loader 2
        config.submittedBy || 'Auto', // Submitted By
        order.customer.name || '', // Customer Name
        order.customer.address || '', // Customer Address
        order.customer.phone || '', // Customer Phone
        order.paymentMethod || '', // Payment Method
        order.amountPaid || 0, // Amount Paid
        order.balance || 0 // Balance
      ];
      
      console.log('Sales record for item:', item.sku.name, record);
      salesRecords.push(record);
    });

    const sheetRange = this.encodeSheetRange('Processed Data Sales', 'A:S');
    console.log('Writing sales records to sheet:', {
      recordCount: salesRecords.length,
      spreadsheetId: config.spreadsheetId,
      range: sheetRange,
      gid: config.salesSheetGid
    });
    
    try {
      await this.appendToSheet(
        config.spreadsheetId, 
        sheetRange, 
        salesRecords, 
        config.salesSheetGid
      );
    } catch (error) {
      if (error.message?.includes('SHEET_PROTECTED')) {
        throw new Error('SHEET_PROTECTED: Cannot write to protected Google Sheet. Please remove sheet protection or grant edit access.');
      }
      throw error;
    }
  }

  async writePaymentRecord(order: Order, config: AppConfig): Promise<void> {
    const currentDate = new Date();
    const timestamp = currentDate.toISOString();
    const deliveryDate = currentDate.toLocaleDateString('en-GB');

    const paymentRecord = [
      timestamp, // Timestamp (Column A)
      deliveryDate, // Delivery Date (Column B)
      order.paymentMethod === 'Bank Transfer' ? 'STANBIC' : 'POS', // Bank (Column C)
      'Warehouse 1 - A', // Warehouse (Column D)
      order.driver || config.drivers[0] || 'DEPOT BULK', // Driver (Column E)
      order.customer.name || '', // Customer Name (Column F)
      order.amountPaid || 0, // AMOUNT (Column G)
      'Y', // USE NOW (Column H)
      '', // FORWARDED DATE (Column I)
      deliveryDate, // NEW DATE (Column J)
      config.submittedBy || 'Auto' // Submitted By (Column K)
    ];

    // Use a more specific range to ensure data starts from column A
    const sheetRange = 'Processed Customer Bank Transfer!A:K';
    console.log('Writing payment record to sheet:', {
      record: paymentRecord,
      spreadsheetId: config.spreadsheetId,
      range: sheetRange,
      gid: config.paymentsSheetGid,
      columnMapping: {
        A: 'Timestamp',
        B: 'Delivery Date', 
        C: 'Bank',
        D: 'Warehouse',
        E: 'Driver',
        F: 'Customer Name',
        G: 'Amount',
        H: 'Use Now',
        I: 'Forwarded Date',
        J: 'New Date',
        K: 'Submitted By'
      }
    });
    
    try {
      await this.appendToSheet(
        config.spreadsheetId, 
        sheetRange, 
        [paymentRecord], 
        config.paymentsSheetGid
      );
    } catch (error) {
      if (error.message?.includes('SHEET_PROTECTED')) {
        throw new Error('SHEET_PROTECTED: Cannot write to protected Google Sheet. Please remove sheet protection or grant edit access.');
      }
      throw error;
    }
  }

  async testConnection(config: AppConfig): Promise<{ success: boolean; message: string }> {
    try {
      // Test by trying to read the price sheet using GID
      await this.fetchSheetData(
        config.spreadsheetId, 
        'PriceData!A1:D1', 
        config.priceSheetGid
      );
      
      return { success: true, message: 'Successfully connected to Google Sheets via GID-based method' };
    } catch (error) {
      return { 
        success: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
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
}
