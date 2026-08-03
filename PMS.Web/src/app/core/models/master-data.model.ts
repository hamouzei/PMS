export enum PropertyType {
  FixedAsset = 1,
  Consumable = 2
}

export enum FieldDataType {
  Text = 1,
  Number = 2,
  Date = 3,
  Boolean = 4,
  Selection = 5
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  parentCategory?: Category;
  subCategories?: Category[];
  createdDate: string;
}

export interface ItemMaster {
  id: string;
  sku: string;
  itemName: string;
  description?: string;
  categoryId: string;
  category?: Category;
  propertyType: PropertyType;
  unitOfMeasure: string;
  requiresInspection: boolean;
  minStockLevel: number;
  unitCost: number;
  isActive: boolean;
  fieldValues?: PropertyFieldValue[];
}

export interface Warehouse {
  id: string;
  warehouseName: string;
  locationCode: string;
  locationType?: string; // HO, Branch, ReTC
  address?: string;
  parentWarehouseId?: string;
  parentWarehouse?: Warehouse;
  shelves?: ShelfLocation[];
}

export interface ShelfLocation {
  id: string;
  warehouseId: string;
  warehouse?: Warehouse;
  aisle?: string;
  rack?: string;
  shelfNumber: string;
  bin?: string;
  qrCodeValue: string;
  capacity?: number;
  fullAddress?: string;
}

export interface SafetyBox {
  id: string;
  boxNumber: string;
  warehouseId: string;
  warehouse?: Warehouse;
  description?: string;
  category?: string;
  totalShelves: number;
  isActive: boolean;
  shelves?: SafetyBoxShelf[];
}

export interface SafetyBoxShelf {
  id: string;
  safetyBoxId: string;
  shelfLabel: string;
  weightCapacity?: number;
  volumeCapacity?: number;
  shelfLocationId?: string;
  shelfLocation?: ShelfLocation;
}

export interface PropertyField {
  id: string;
  fieldName: string;
  fieldType: FieldDataType;
  isRequired: boolean;
  applicablePropertyType?: PropertyType;
  displayOrder: number;
  options?: string; // JSON array for Selection type
  isActive: boolean;
}

export interface PropertyFieldValue {
  id: string;
  propertyFieldId: string;
  propertyField?: PropertyField;
  itemId: string;
  value: string;
}

export interface Supplier {
  id: string;
  supplierName: string;
  contactPerson?: string;
  tinNumber?: string;
  phoneNumber?: string;
  email?: string;
}

export interface BudgetAllocation {
  id: string;
  fiscalYear: number;
  department?: string;
  division?: string;
  allocatedAmount: number;
  utilizedAmount: number;
  remainingAmount: number;
}
