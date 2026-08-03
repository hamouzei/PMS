import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AppUserDto, CreateUserRequest, ResetPasswordRequest, UpdateUserRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private readonly http = inject(HttpClient);

  public getUsers(): Observable<AppUserDto[]> {
    return this.http.get<AppUserDto[]>('/admin/users');
  }

  public createUser(request: CreateUserRequest): Observable<AppUserDto> {
    return this.http.post<AppUserDto>('/admin/users', request);
  }

  public updateUser(id: string, request: UpdateUserRequest): Observable<AppUserDto> {
    return this.http.put<AppUserDto>(`/admin/users/${id}`, request);
  }

  public resetPassword(id: string, request: ResetPasswordRequest): Observable<boolean> {
    return this.http.post<boolean>(`/admin/users/${id}/reset-password`, request);
  }
}
