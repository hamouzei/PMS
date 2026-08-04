import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUserDto, CreateUserRequest, ResetPasswordRequest, UpdateUserRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private readonly http = inject(HttpClient);

  /** GET /api/master-data/users — lives on MasterDataController */
  public getUsers(): Observable<AppUserDto[]> {
    return this.http.get<AppUserDto[]>('/master-data/users');
  }

  /** POST /api/master-data/users — lives on MasterDataController */
  public createUser(request: CreateUserRequest): Observable<AppUserDto> {
    return this.http.post<AppUserDto>('/master-data/users', request);
  }

  /** PUT /api/admin/users/{id} — lives on AdminController */
  public updateUser(id: string, request: UpdateUserRequest): Observable<AppUserDto> {
    return this.http.put<AppUserDto>(`/admin/users/${id}`, request);
  }

  /** POST /api/admin/users/{id}/reset-password — lives on AdminController */
  public resetPassword(id: string, request: ResetPasswordRequest): Observable<boolean> {
    return this.http.post<boolean>(`/admin/users/${id}/reset-password`, request);
  }
}
