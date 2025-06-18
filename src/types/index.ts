
export interface SKU {
  id: string;
  name: string;
  unitPrice: number;
  packType: string;
  packType2?: string;
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

export interface SalesRecord {
  timestamp: string;
  skuName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  driver: string;
  paymentMethod: string;
  amountPaid: number;
  balance: number;
}

export interface PaymentRecord {
  timestamp: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  reference: string;
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
}
