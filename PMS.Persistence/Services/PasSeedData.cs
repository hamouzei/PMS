using Microsoft.EntityFrameworkCore;
using PMS.Domain.Entities;
using PMS.Domain.Enums;

namespace PMS.Persistence.Services;

public static class PasSeedData
{
    public static async Task SeedAsync(PMSDbContext context, CancellationToken cancellationToken = default)
    {
        var seedPasswordHash = BCrypt.Net.BCrypt.HashPassword("Pass@123");
        var usersMissingPasswords = await context.Users
            .Where(user => user.PasswordHash == string.Empty)
            .ToListAsync(cancellationToken);

        foreach (var user in usersMissingPasswords)
        {
            user.PasswordHash = seedPasswordHash;
        }

        if (usersMissingPasswords.Count > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
        }

        if (await context.Users.AnyAsync(cancellationToken))
        {
            return;
        }

        var users = new[]
        {
            new AppUser { EmployeeId = "PAS-ADMIN", UserName = "admin", FullName = "Property Administrator", PasswordHash = seedPasswordHash, Role = UserRole.PropertyAdmin, Department = "Property Administration", Division = "HO" },
            new AppUser { EmployeeId = "PAS-STORE", UserName = "storekeeper", FullName = "Central Store Keeper", PasswordHash = seedPasswordHash, Role = UserRole.Storekeeper, Department = "Property Administration", Division = "HO" },
            new AppUser { EmployeeId = "PAS-REQ", UserName = "requester", FullName = "Requisitioning Staff", PasswordHash = seedPasswordHash, Role = UserRole.RequisitioningStaff, Department = "Operations", Division = "HO" },
            new AppUser { EmployeeId = "PAS-MGR", UserName = "manager", FullName = "Department Manager", PasswordHash = seedPasswordHash, Role = UserRole.DepartmentManager, Department = "Operations", Division = "HO" },
            new AppUser { EmployeeId = "PAS-INSP", UserName = "inspector", FullName = "Inspection Officer", PasswordHash = seedPasswordHash, Role = UserRole.Inspector, Department = "Property Administration", Division = "HO" },
            new AppUser { EmployeeId = "PAS-COMP", UserName = "compliance", FullName = "Compliance Officer", PasswordHash = seedPasswordHash, Role = UserRole.ComplianceOfficer, Department = "Compliance", Division = "HO" }
        };

        var fixedAssets = new Category { Name = "Fixed Assets", Description = "Capital assets tracked under user custody." };
        var consumables = new Category { Name = "Consumables", Description = "Supplies issued from store stock." };

        var laptop = new ItemMaster
        {
            Sku = "FA-LAP-001",
            ItemName = "Laptop Computer",
            Category = fixedAssets,
            PropertyType = PropertyType.FixedAsset,
            UnitOfMeasure = "PCS",
            RequiresInspection = true,
            MinStockLevel = 2,
            UnitCost = 85000
        };
        var paper = new ItemMaster
        {
            Sku = "CON-PAP-001",
            ItemName = "A4 Paper Ream",
            Category = consumables,
            PropertyType = PropertyType.Consumable,
            UnitOfMeasure = "REAM",
            RequiresInspection = false,
            MinStockLevel = 20,
            UnitCost = 450
        };

        var warehouse = new Warehouse
        {
            WarehouseName = "Head Office Central Store",
            LocationCode = "ECX-HO",
            LocationType = "HeadOffice",
            Address = "Addis Ababa"
        };
        var shelfA = new ShelfLocation
        {
            Warehouse = warehouse,
            Aisle = "A",
            Rack = "R1",
            ShelfNumber = "S1",
            Bin = "B1",
            QrCodeValue = "ECX-HO-A-R1-S1-B1",
            Capacity = 100
        };
        var shelfB = new ShelfLocation
        {
            Warehouse = warehouse,
            Aisle = "A",
            Rack = "R1",
            ShelfNumber = "S2",
            Bin = "B1",
            QrCodeValue = "ECX-HO-A-R1-S2-B1",
            Capacity = 500
        };

        var supplier = new Supplier
        {
            SupplierName = "Demo Supplier PLC",
            ContactPerson = "Demo Contact",
            TinNumber = "0000000001",
            PhoneNumber = "+251911000000",
            Email = "supplier@example.com"
        };

        context.AddRange(users);
        context.AddRange(fixedAssets, consumables, laptop, paper, warehouse, shelfA, shelfB, supplier);
        await context.SaveChangesAsync(cancellationToken);

        context.InventoryStocks.AddRange(
            new InventoryStock
            {
                ItemId = laptop.Id,
                ShelfId = shelfA.Id,
                CurrentQuantity = 5,
                BookBalance = 5,
                PhysicalBalance = 5
            },
            new InventoryStock
            {
                ItemId = paper.Id,
                ShelfId = shelfB.Id,
                CurrentQuantity = 100,
                BookBalance = 100,
                PhysicalBalance = 100
            });

        context.StockLedgers.AddRange(
            new StockLedger
            {
                ItemId = laptop.Id,
                ShelfId = shelfA.Id,
                QuantityChange = 5,
                BalanceAfter = 5,
                TransactionType = StockTransactionType.OpeningBalance,
                DocumentType = DocumentType.AnnualInventory,
                ReferenceNumber = "SEED-OPENING"
            },
            new StockLedger
            {
                ItemId = paper.Id,
                ShelfId = shelfB.Id,
                QuantityChange = 100,
                BalanceAfter = 100,
                TransactionType = StockTransactionType.OpeningBalance,
                DocumentType = DocumentType.AnnualInventory,
                ReferenceNumber = "SEED-OPENING"
            });

        await context.SaveChangesAsync(cancellationToken);
    }
}
