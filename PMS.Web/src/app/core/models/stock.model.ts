import { DocumentType } from './workflow.model';

export enum StockTransactionType {
  OpeningBalance = 1,
  Receipt = 2,
  InspectionRelease = 3,
  Reservation = 4,
  Issue = 5,
  Return = 6,
  TransferOut = 7,
  TransferIn = 8,
  Disposal = 9,
  Adjustment = 10
}

export interface InventoryStock {
  id: string;
  itemId: string;
  shelfId: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  bookBalance: number;
  physicalBalance: number;
  discrepancy: number;
  lastCountedAt?: string;
}

export interface StockLedger {
  id: string;
  itemId: string;
  shelfId: string;
  quantityChange: number;
  balanceAfter: number;
  transactionType: StockTransactionType;
  documentType?: DocumentType;
  referenceId?: string;
  referenceNumber?: string;
  unitCost?: number;
  reason?: string;
  transactionDate: string;
}

export interface UserCustody {
  id: string;
  custodianId: string;
  itemId: string;
  quantity: number;
  tagNumber?: string;
  serialNumber?: string;
  sourceDocumentNumber: string;
  createdDate: string;
}

export interface RegisterOpeningBalanceRequest {
  itemId: string;
  shelfId: string;
  quantity: number;
  unitCost?: number;
  reason?: string;
}

export interface StockAdjustmentRequest {
  itemId: string;
  shelfId: string;
  quantityChange: number;
  reason: string;
}
