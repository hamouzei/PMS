export interface DashboardKpiResponse {
  stockItems: number;
  lowStock: number;
  pendingStoreRequests: number;
  pendingPurchaseRequests: number;
  pendingReceiving: number;
  pendingReturns: number;
  pendingTransfers: number;
  pendingHandovers: number;
  pendingDisposals: number;
  pendingInspections: number;
}

export interface StockSummaryReportRow {
  itemId: string;
  sku: string;
  itemName: string;
  unitOfMeasure: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minStockLevel: number;
}

export interface PropertyMovementReportRow {
  id: string;
  itemName: string;
  referenceNumber?: string;
  transactionType: string;
  quantityChange: number;
  balanceAfter: number;
  unitCost?: number;
  reason?: string;
  transactionDate: string;
}

export interface AuditTrailReportRow {
  id: string;
  action: string;
  entityName: string;
  entityId?: string;
  details?: string;
  actionDate: string;
  userName: string;
}

export interface NotificationEventDto {
  id: string;
  recipientId?: string;
  recipientRole?: string;
  title: string;
  message: string;
  referenceId?: string;
  referenceNumber?: string;
  isRead: boolean;
  readAt?: string;
  createdDate: string;
}
