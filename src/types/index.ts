
export interface SKU {
  id: string;
  name: string;
  unitPrice: number;
  packType: string;
  packType2: string;
}

export interface CartItem {
  sku: SKU;
  quantity: number;
  lineTotal: number;
}

export interface Customer {
  name: string;
  address: string;
  phone: string;
}

export interface Order {
  id: string;
  customer: Customer;
  items: CartItem[];
  subtotal: number;
  total: number;
  paymentMethod: 'Bank Transfer' | 'POS';
  amountPaid: number;
  balance: number;
  timestamp: Date;
  driver: string;
}

// Sales sheet record structure (matching your first image)
export interface SalesRecord {
  timestamp: string;
  transactionDate: string;
  warehouse: string;
  loadOut: string;
  skuName: string;
  skuQty: number;
  skuPrice: number;
  totalAmount: number;
  packType: string;
  driverSeller: string;
  loader1: string;
  loader2: string;
  submittedBy: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  paymentMethod: string;
  amountPaid: number;
  balance: number;
}

// Payment sheet record structure (matching your third image)
export interface PaymentRecord {
  timestamp: string;
  deliveryDate: string;
  bank: string;
  warehouse: string;
  driver: string;
  customerName: string;
  amount: number;
  useNow: string;
  forwardedDate: string;
  newDate: string;
}

export interface AppConfig {
  spreadsheetId: string;
  salesSheetGid: string;
  priceSheetGid: string;
  paymentsSheetGid: string;
  drivers: string[];
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  googleSheetsApiKey: string;
  loader1: string;
  loader2: string;
  submittedBy: string;
}
