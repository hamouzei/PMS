namespace PMS.API.Authorization;

public static class PasRoles
{
    public const string Employee = "Employee";
    public const string PropertyAdmin = "PropertyAdmin";
    public const string Storekeeper = "Storekeeper";
    public const string RequisitioningStaff = "RequisitioningStaff";
    public const string DepartmentManager = "DepartmentManager";
    public const string Inspector = "Inspector";
    public const string ComplianceOfficer = "ComplianceOfficer";
    public const string ReportViewer = "ReportViewer";
    public const string ProcurementOfficer = "ProcurementOfficer";
    public const string FinanceOfficer = "FinanceOfficer";

    public const string AdminOrStorekeeper = PropertyAdmin + "," + Storekeeper;
    public const string RequestActors = Employee + "," + RequisitioningStaff + "," + DepartmentManager + "," + PropertyAdmin;
    public const string Approvers = DepartmentManager + "," + PropertyAdmin;
    public const string StockActors = PropertyAdmin + "," + Storekeeper;
    public const string ReportActors = PropertyAdmin + "," + DepartmentManager + "," + ComplianceOfficer + "," + ReportViewer + "," + FinanceOfficer;
    public const string HandoverActors = PropertyAdmin + "," + DepartmentManager + "," + Storekeeper;
    public const string ComplianceActors = ComplianceOfficer + "," + PropertyAdmin;
}
