import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BudgetAllocation,
  Category,
  ItemMaster,
  PropertyField,
  PropertyFieldValue,
  SafetyBox,
  ShelfLocation,
  Supplier,
  Warehouse
} from '../models/master-data.model';

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  parentCategoryId?: string;
}

export interface CreateItemRequest {
  sku: string;
  itemName: string;
  description?: string;
  categoryId: string;
  propertyType: number;
  unitOfMeasure: string;
  requiresInspection: boolean;
  minStockLevel: number;
  unitCost: number;
  fieldValues?: { propertyFieldId: string; value: string }[];
}

export interface CreateWarehouseRequest {
  warehouseName: string;
  locationCode: string;
  locationType?: string;
  address?: string;
  parentWarehouseId?: string;
}

export interface CreateShelfLocationRequest {
  warehouseId: string;
  aisle?: string;
  rack?: string;
  shelfNumber: string;
  bin?: string;
  qrCodeValue: string;
  capacity?: number;
}

export interface CreateSupplierRequest {
  supplierName: string;
  contactPerson?: string;
  tinNumber?: string;
  phoneNumber?: string;
  email?: string;
}

export interface CreatePropertyFieldRequest {
  fieldName: string;
  fieldType: number;
  isRequired: boolean;
  applicablePropertyType?: number;
  displayOrder: number;
  options?: string;
}

export interface SetPropertyFieldValueRequest {
  propertyFieldId: string;
  itemId: string;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class MasterDataApiService {
  private readonly http = inject(HttpClient);

  // Categories
  public getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>('/master-data/categories');
  }

  public createCategory(request: CreateCategoryRequest): Observable<Category> {
    return this.http.post<Category>('/master-data/categories', request);
  }

  public updateCategory(id: string, request: CreateCategoryRequest): Observable<Category> {
    return this.http.put<Category>(`/master-data/categories/${id}`, request);
  }

  public searchCategories(q?: string): Observable<Category[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<Category[]>('/master-data/categories/search', { params });
  }

  // Item Catalog
  public getItems(): Observable<ItemMaster[]> {
    return this.http.get<ItemMaster[]>('/master-data/items');
  }

  public getItemById(id: string): Observable<ItemMaster> {
    return this.http.get<ItemMaster>(`/master-data/items/${id}`);
  }

  public createItem(request: CreateItemRequest): Observable<ItemMaster> {
    return this.http.post<ItemMaster>('/master-data/items', request);
  }

  public updateItem(id: string, request: CreateItemRequest): Observable<ItemMaster> {
    return this.http.put<ItemMaster>(`/master-data/items/${id}`, request);
  }

  public searchItems(q?: string): Observable<{ id: string; sku: string; itemName: string; unitOfMeasure: string; propertyType: number }[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<{ id: string; sku: string; itemName: string; unitOfMeasure: string; propertyType: number }[]>('/master-data/items/search', { params });
  }

  // Warehouses & Shelves
  public getWarehouses(): Observable<Warehouse[]> {
    return this.http.get<Warehouse[]>('/master-data/warehouses');
  }

  public createWarehouse(request: CreateWarehouseRequest): Observable<Warehouse> {
    return this.http.post<Warehouse>('/master-data/warehouses', request);
  }

  public getShelves(): Observable<ShelfLocation[]> {
    return this.http.get<ShelfLocation[]>('/master-data/shelves');
  }

  public createShelf(request: CreateShelfLocationRequest): Observable<ShelfLocation> {
    return this.http.post<ShelfLocation>('/master-data/shelves', request);
  }

  // Suppliers
  public getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>('/master-data/suppliers');
  }

  public createSupplier(request: CreateSupplierRequest): Observable<Supplier> {
    return this.http.post<Supplier>('/master-data/suppliers', request);
  }

  // Dynamic Property Fields Schema
  public getPropertyFields(): Observable<PropertyField[]> {
    return this.http.get<PropertyField[]>('/master-data/property-fields');
  }

  public createPropertyField(request: CreatePropertyFieldRequest): Observable<PropertyField> {
    return this.http.post<PropertyField>('/master-data/property-fields', request);
  }

  public setPropertyFieldValue(request: SetPropertyFieldValueRequest): Observable<PropertyFieldValue> {
    return this.http.post<PropertyFieldValue>('/master-data/property-field-values', request);
  }
}
