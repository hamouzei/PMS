import { PropertyType } from './master-data.model';

export enum DocumentType {
  SR = 1,
  PR = 2,
  GRN = 3,
  FARN = 4,
  SIV = 5,
  FAIV = 6,
  RMRN = 7,
  RMTN = 8,
  Disposal = 9,
  AnnualInventory = 10,
  Handover = 11,
  Compliance = 12
}

export enum WorkflowStatus {
  Draft = 1,
  Submitted = 2,
  PendingApproval = 3,
  Approved = 4,
  Rejected = 5,
  Cancelled = 6,
  Received = 7,
  InspectionPending = 8,
  InspectionPassed = 9,
  InspectionFailed = 10,
  Issued = 11,
  Returned = 12,
  Transferred = 13,
  Disposed = 14,
  Closed = 15,
  HandedOver = 16
}

export enum RequestType {
  Budgeted = 1,
  Replacement = 2,
  Emergency = 3,
  Other = 4
}

export enum PropertyCondition {
  New = 1,
  FunctionalUsed = 2,
  Damaged = 3,
  Obsolete = 4,
  NonFunctional = 5
}

export enum DisposalMethod {
  Auction = 1,
  Tendering = 2,
  Scrapping = 3,
  Other = 4
}

export const PROPERTY_CONDITION_LABELS: Record<number, string> = {
  [PropertyCondition.New]: 'New',
  [PropertyCondition.FunctionalUsed]: 'Functional (Used)',
  [PropertyCondition.Damaged]: 'Damaged',
  [PropertyCondition.Obsolete]: 'Obsolete',
  [PropertyCondition.NonFunctional]: 'Non-Functional'
};

export interface ServiceRequest {
  id: string;
  srNumber: string;
  requesterId: string;
  requestDate: string;
  requestType: RequestType;
  status: WorkflowStatus;
  reason?: string;
  supervisorRemark?: string;
  details: ServiceRequestDetail[];
  requester?: { fullName: string };
  approvedBy?: { fullName: string };
}

export interface ServiceRequestDetail {
  id: string;
  serviceRequestId: string;
  itemId: string;
  shelfId?: string;
  requestedQty: number;
  approvedQty: number;
  issuedQty: number;
  unitCost?: number;
  remarks?: string;
  item?: { itemName: string; sku: string };
}

export interface PurchaseRequest {
  id: string;
  prNumber: string;
  requesterId: string;
  requestDate: string;
  status: WorkflowStatus;
  requestType: RequestType;
  justification?: string;
  estimatedBudget?: number;
  rejectionReason?: string;
  details: PurchaseRequestDetail[];
  requester?: { fullName: string };
  approvedBy?: { fullName: string };
}

export interface PurchaseRequestDetail {
  id: string;
  purchaseRequestId: string;
  itemId?: string;
  itemDescription: string;
  unitOfMeasure: string;
  quantity: number;
  unitCost?: number;
  item?: { itemName: string; sku: string };
}

export interface ReceivingNote {
  id: string;
  grnNumber: string;
  farnNumber?: string;
  supplierId: string;
  warehouseId: string;
  receivedById: string;
  receivedDate: string;
  status: WorkflowStatus;
  invoiceNumber?: string;
  purchaseOrderNumber?: string;
  storeRequestNumber?: string;
  tenderReferenceNumber?: string;
  notes?: string;
  details: ReceivingNoteDetail[];
  supplier?: { supplierName: string };
  receivedBy?: { fullName: string };
  approvedBy?: { fullName: string };
  inspectionLog?: InspectionLog;
}

export interface ReceivingNoteDetail {
  id: string;
  receivingNoteId: string;
  itemId: string;
  shelfId?: string;
  quantityReceived: number;
  unitCost: number;
  tagNumber?: string;
  serialNumber?: string;
  item?: { itemName: string; sku: string };
}

export interface InspectionLog {
  id: string;
  receivingNoteId: string;
  inspectorId: string;
  isPassed: boolean;
  deviationNotes?: string;
  inspectionDate: string;
}

export interface StoreIssueVoucher {
  id: string;
  serviceRequestId: string;
  sivNumber: string;
  faivNumber?: string;
  voucherType: DocumentType;
  issueDate: string;
  issuedById: string;
  recipientSignature?: string;
  status: WorkflowStatus;
  details: StoreIssueVoucherDetail[];
  issuedBy?: { fullName: string };
  serviceRequest?: { srNumber: string };
}

export interface StoreIssueVoucherDetail {
  id: string;
  storeIssueVoucherId: string;
  itemId: string;
  shelfId: string;
  quantityIssued: number;
  unitCost?: number;
  item?: { itemName: string; sku: string };
}

export interface PropertyReturn {
  id: string;
  rmrnNumber: string;
  returnedById: string;
  receivedById?: string;
  returnDate: string;
  status: WorkflowStatus;
  reason?: string;
  details: PropertyReturnDetail[];
  returnedBy?: { fullName: string };
  receivedBy?: { fullName: string };
  authorizedBy?: { fullName: string };
}

export interface PropertyReturnDetail {
  id: string;
  propertyReturnId: string;
  itemId: string;
  shelfId: string;
  quantity: number;
  unitCost?: number;
  tagNumber?: string;
  serialNumber?: string;
  condition: PropertyCondition;
  item?: { itemName: string; sku: string };
}

export interface PropertyTransfer {
  id: string;
  rmtnNumber: string;
  fromCustodianId: string;
  toCustodianId: string;
  transferDate: string;
  status: WorkflowStatus;
  reason?: string;
  details: PropertyTransferDetail[];
  fromCustodian?: { fullName: string };
  toCustodian?: { fullName: string };
  authorizedBy?: { fullName: string };
}

export interface PropertyTransferDetail {
  id: string;
  propertyTransferId: string;
  itemId: string;
  quantity: number;
  tagNumber?: string;
  serialNumber?: string;
  item?: { itemName: string; sku: string };
}

export interface PropertyHandover {
  id: string;
  handoverNumber: string;
  handoverFromId: string;
  handoverToId: string;
  handoverDate: string;
  status: WorkflowStatus;
  purpose?: string;
  fromLocation?: string;
  toLocation?: string;
  remarks?: string;
  details: PropertyHandoverDetail[];
  handoverFrom?: { fullName: string };
  handoverTo?: { fullName: string };
  authorizedBy?: { fullName: string };
}

export interface PropertyHandoverDetail {
  id: string;
  propertyHandoverId: string;
  itemId: string;
  quantity: number;
  tagNumber?: string;
  serialNumber?: string;
  farnNumber?: string;
  rmrnNumber?: string;
  faivNumber?: string;
  item?: { itemName: string; sku: string };
}

export interface DisposalRecord {
  id: string;
  disposalNumber: string;
  itemId: string;
  shelfId?: string;
  custodianId?: string;
  quantity: number;
  condition: PropertyCondition;
  disposalMethod: DisposalMethod;
  status: WorkflowStatus;
  notes?: string;
}

export interface AnnualInventory {
  id: string;
  inventoryNumber: string;
  fiscalYear: number;
  location: string;
  countedById: string;
  status: WorkflowStatus;
  countDate: string;
  lines: AnnualInventoryLine[];
}

export interface AnnualInventoryLine {
  id: string;
  annualInventoryId: string;
  itemId: string;
  shelfId?: string;
  expectedQuantity: number;
  countedQuantity: number;
  discrepancy: number;
  notes?: string;
}

export interface ComplianceRecord {
  id: string;
  complianceNumber: string;
  inventoryId?: string;
  reviewedById: string;
  status: WorkflowStatus;
  findings?: string;
  recommendations?: string;
  correctiveActions?: string;
  reviewDate: string;
}
