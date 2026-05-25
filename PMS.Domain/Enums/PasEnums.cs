namespace PMS.Domain.Enums;

public enum UserRole
{
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

public enum PropertyType
{
    FixedAsset = 1,
    Consumable = 2
}

public enum DocumentType
{
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

public enum WorkflowStatus
{
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

public enum StockTransactionType
{
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

public enum RequestType
{
    Budgeted = 1,
    Replacement = 2,
    Emergency = 3,
    Other = 4
}

public enum PropertyCondition
{
    New = 1,
    FunctionalUsed = 2,
    Damaged = 3,
    Obsolete = 4,
    NonFunctional = 5
}

public enum DisposalMethod
{
    Auction = 1,
    Tendering = 2,
    Scrapping = 3,
    Other = 4
}

public enum FieldDataType
{
    Text = 1,
    Number = 2,
    Date = 3,
    Boolean = 4,
    Selection = 5
}
