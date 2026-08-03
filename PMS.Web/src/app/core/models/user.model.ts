export enum UserRole {
  Employee = 1,
  PropertyAdmin = 2,
  Storekeeper = 3,
  RequisitioningStaff = 4,
  DepartmentManager = 5,
  Inspector = 6,
  ComplianceOfficer = 7,
  ReportViewer = 8,
  ProcurementOfficer = 9,
  FinanceOfficer = 10
}

export type UserRoleName = keyof typeof UserRole;

export interface AppUserDto {
  id: string;
  employeeId: string;
  userName: string;
  fullName: string;
  role: UserRole;
  department?: string;
  division?: string;
  location?: string;
  title?: string;
  isActive: boolean;
}

export interface LoginRequest {
  employeeId: string;
  userName: string;
  password: string;
}

export interface LoginResponse {
  scheme: string;
  employeeId: string;
  userName: string;
  role: string;
  token: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  requiredHeaders: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface CreateUserRequest {
  employeeId: string;
  userName: string;
  fullName: string;
  password: string;
  role: UserRole;
  department?: string;
  division?: string;
  location?: string;
  title?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  role?: UserRole;
  department?: string;
  division?: string;
  location?: string;
  title?: string;
  isActive?: boolean;
}

export interface ResetPasswordRequest {
  newPassword: string;
}
