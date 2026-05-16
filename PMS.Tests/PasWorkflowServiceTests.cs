using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using PMS.Application.DTO;
using PMS.Domain.Entities;
using PMS.Domain.Enums;
using PMS.Persistence;
using PMS.Persistence.Services;

namespace PMS.Tests;

public class PasWorkflowServiceTests
{
    [Fact]
    public async Task RegisterOpeningBalance_creates_stock_and_ledger()
    {
        await using var context = CreateContext();
        var seed = await SeedStockSetup(context);
        var service = new PasWorkflowService(context);

        var stock = await service.RegisterOpeningBalance(new RegisterOpeningBalanceRequest(
            seed.Item.Id,
            seed.Shelf.Id,
            10,
            25,
            "Initial count"));

        Assert.Equal(10, stock.CurrentQuantity);
        Assert.Equal(10, stock.BookBalance);
        Assert.Single(await context.StockLedgers.ToListAsync());
        Assert.Equal(StockTransactionType.OpeningBalance, (await context.StockLedgers.SingleAsync()).TransactionType);
    }

    [Fact]
    public async Task Approve_and_issue_store_request_reserves_then_deducts_stock()
    {
        await using var context = CreateContext();
        var seed = await SeedStockSetup(context);
        var service = new PasWorkflowService(context);

        await service.RegisterOpeningBalance(new RegisterOpeningBalanceRequest(
            seed.Item.Id,
            seed.Shelf.Id,
            10,
            25,
            "Initial count"));

        var storeRequest = await service.CreateStoreRequest(new CreateStoreRequestRequest(
            seed.Requester.Id,
            RequestType.Budgeted,
            "Need equipment",
            [new StockLineRequest(seed.Item.Id, seed.Shelf.Id, 4, 25, null, null, null)]));

        await service.ApproveStoreRequest(storeRequest.Id, new ApproveRequest(seed.Approver.Id, "Approved"));
        var reservedStock = await context.InventoryStocks.SingleAsync();
        Assert.Equal(4, reservedStock.ReservedQuantity);
        Assert.Equal(10, reservedStock.CurrentQuantity);

        var voucher = await service.IssueApprovedRequest(new IssueStockRequest(
            storeRequest.Id,
            seed.Storekeeper.Id,
            "signed"));

        var issuedStock = await context.InventoryStocks.SingleAsync();
        Assert.Equal(6, issuedStock.CurrentQuantity);
        Assert.Equal(0, issuedStock.ReservedQuantity);
        Assert.Equal(WorkflowStatus.Issued, (await context.ServiceRequests.SingleAsync()).Status);
        Assert.Equal(DocumentType.FAIV, voucher.VoucherType);
        Assert.Single(await context.UserCustodies.ToListAsync());
    }

    private static PMSDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<PMSDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new PMSDbContext(options);
    }

    private static async Task<SeedData> SeedStockSetup(PMSDbContext context)
    {
        var category = new Category { Name = "Equipment" };
        var item = new ItemMaster
        {
            Sku = "EQ-001",
            ItemName = "Laptop",
            Category = category,
            PropertyType = PropertyType.FixedAsset,
            UnitOfMeasure = "PCS",
            RequiresInspection = true,
            MinStockLevel = 1,
            UnitCost = 25
        };
        var warehouse = new Warehouse
        {
            WarehouseName = "Central Store",
            LocationCode = "HO"
        };
        var shelf = new ShelfLocation
        {
            Warehouse = warehouse,
            ShelfNumber = "S1",
            QrCodeValue = "HO-S1"
        };
        var requester = new AppUser
        {
            EmployeeId = "E001",
            UserName = "requester",
            FullName = "Requester User",
            Role = UserRole.RequisitioningStaff
        };
        var approver = new AppUser
        {
            EmployeeId = "E002",
            UserName = "approver",
            FullName = "Approver User",
            Role = UserRole.DepartmentManager
        };
        var storekeeper = new AppUser
        {
            EmployeeId = "E003",
            UserName = "storekeeper",
            FullName = "Store Keeper",
            Role = UserRole.Storekeeper
        };

        context.AddRange(category, item, warehouse, shelf, requester, approver, storekeeper);
        await context.SaveChangesAsync();
        return new SeedData(item, shelf, requester, approver, storekeeper);
    }

    private sealed record SeedData(
        ItemMaster Item,
        ShelfLocation Shelf,
        AppUser Requester,
        AppUser Approver,
        AppUser Storekeeper);
}
