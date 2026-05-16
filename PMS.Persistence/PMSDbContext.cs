using Microsoft.EntityFrameworkCore;
using PMS.Domain.Common;
using PMS.Domain.Entities;

namespace PMS.Persistence;

public class PMSDbContext(DbContextOptions<PMSDbContext> options) : DbContext(options)
{
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<ItemMaster> ItemMasters => Set<ItemMaster>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<ShelfLocation> ShelfLocations => Set<ShelfLocation>();
    public DbSet<InventoryStock> InventoryStocks => Set<InventoryStock>();
    public DbSet<StockLedger> StockLedgers => Set<StockLedger>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<DocumentAttachment> DocumentAttachments => Set<DocumentAttachment>();
    public DbSet<NotificationEvent> NotificationEvents => Set<NotificationEvent>();
    public DbSet<AuditTrail> AuditTrails => Set<AuditTrail>();
    public DbSet<DocumentSequence> DocumentSequences => Set<DocumentSequence>();
    public DbSet<ServiceRequest> ServiceRequests => Set<ServiceRequest>();
    public DbSet<ServiceRequestDetail> ServiceRequestDetails => Set<ServiceRequestDetail>();
    public DbSet<PurchaseRequest> PurchaseRequests => Set<PurchaseRequest>();
    public DbSet<PurchaseRequestDetail> PurchaseRequestDetails => Set<PurchaseRequestDetail>();
    public DbSet<ReceivingNote> ReceivingNotes => Set<ReceivingNote>();
    public DbSet<ReceivingNoteDetail> ReceivingNoteDetails => Set<ReceivingNoteDetail>();
    public DbSet<InspectionLog> InspectionLogs => Set<InspectionLog>();
    public DbSet<StoreIssueVoucher> StoreIssueVouchers => Set<StoreIssueVoucher>();
    public DbSet<StoreIssueVoucherDetail> StoreIssueVoucherDetails => Set<StoreIssueVoucherDetail>();
    public DbSet<PropertyReturn> PropertyReturns => Set<PropertyReturn>();
    public DbSet<PropertyReturnDetail> PropertyReturnDetails => Set<PropertyReturnDetail>();
    public DbSet<PropertyTransfer> PropertyTransfers => Set<PropertyTransfer>();
    public DbSet<PropertyTransferDetail> PropertyTransferDetails => Set<PropertyTransferDetail>();
    public DbSet<UserCustody> UserCustodies => Set<UserCustody>();
    public DbSet<DisposalRecord> DisposalRecords => Set<DisposalRecord>();
    public DbSet<AnnualInventory> AnnualInventories => Set<AnnualInventory>();
    public DbSet<AnnualInventoryLine> AnnualInventoryLines => Set<AnnualInventoryLine>();
    public DbSet<StockSummaryReport> StockSummaryReports => Set<StockSummaryReport>();
    public DbSet<PropertyMovementReport> PropertyMovementReports => Set<PropertyMovementReport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigurePasModel(modelBuilder);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(BaseDomainEntity).IsAssignableFrom(entityType.ClrType))
            {
                continue;
            }

            modelBuilder.Entity(entityType.ClrType)
                .Property(nameof(BaseDomainEntity.CreatedDate))
                .HasDefaultValueSql("SYSUTCDATETIME()");

            modelBuilder.Entity(entityType.ClrType)
                .Property(nameof(BaseDomainEntity.UpdatedDate))
                .HasDefaultValueSql("SYSUTCDATETIME()");
        }

        foreach (var foreignKey in modelBuilder.Model.GetEntityTypes().SelectMany(entity => entity.GetForeignKeys()))
        {
            foreignKey.DeleteBehavior = DeleteBehavior.Restrict;
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditFields();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess,
        CancellationToken cancellationToken = default)
    {
        ApplyAuditFields();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void ApplyAuditFields()
    {
        var utcNow = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<BaseDomainEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity.Id == Guid.Empty)
                {
                    entry.Entity.Id = Guid.NewGuid();
                }

                entry.Entity.CreatedDate = utcNow;
                entry.Entity.UpdatedDate = utcNow;
            }

            if (entry.State == EntityState.Modified)
            {
                entry.Property(entity => entity.CreatedDate).IsModified = false;
                entry.Entity.UpdatedDate = utcNow;
            }
        }
    }

    private static void ConfigurePasModel(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.Property(value => value.Name).HasMaxLength(150).IsRequired();
            entity.HasIndex(value => new { value.ParentCategoryId, value.Name }).IsUnique();
            entity.HasOne(value => value.ParentCategory)
                .WithMany(value => value.SubCategories)
                .HasForeignKey(value => value.ParentCategoryId);
        });

        modelBuilder.Entity<ItemMaster>(entity =>
        {
            entity.Property(value => value.Sku).HasMaxLength(80).IsRequired();
            entity.Property(value => value.ItemName).HasMaxLength(200).IsRequired();
            entity.Property(value => value.UnitOfMeasure).HasMaxLength(50).IsRequired();
            entity.Property(value => value.UnitCost).HasPrecision(18, 2);
            entity.HasIndex(value => value.Sku).IsUnique();
        });

        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.ToTable("Users");
            entity.Property(value => value.EmployeeId).HasMaxLength(80).IsRequired();
            entity.Property(value => value.UserName).HasMaxLength(100).IsRequired();
            entity.Property(value => value.FullName).HasMaxLength(200).IsRequired();
            entity.HasIndex(value => value.EmployeeId).IsUnique();
            entity.HasIndex(value => value.UserName).IsUnique();
        });

        modelBuilder.Entity<Warehouse>(entity =>
        {
            entity.Property(value => value.WarehouseName).HasMaxLength(200).IsRequired();
            entity.Property(value => value.LocationCode).HasMaxLength(80).IsRequired();
            entity.HasIndex(value => value.LocationCode).IsUnique();
        });

        modelBuilder.Entity<ShelfLocation>(entity =>
        {
            entity.Property(value => value.ShelfNumber).HasMaxLength(80).IsRequired();
            entity.Property(value => value.QrCodeValue).HasMaxLength(200).IsRequired();
            entity.Property(value => value.Capacity).HasPrecision(18, 2);
            entity.HasIndex(value => value.QrCodeValue).IsUnique();
            entity.HasIndex(value => new { value.WarehouseId, value.Aisle, value.Rack, value.ShelfNumber, value.Bin }).IsUnique();
        });

        modelBuilder.Entity<InventoryStock>(entity =>
        {
            entity.HasIndex(value => new { value.ItemId, value.ShelfId }).IsUnique();
            entity.ToTable(table => table.HasCheckConstraint("CK_InventoryStock_CurrentQuantity", "[CurrentQuantity] >= 0"));
            entity.ToTable(table => table.HasCheckConstraint("CK_InventoryStock_ReservedQuantity", "[ReservedQuantity] >= 0"));
        });

        modelBuilder.Entity<StockLedger>(entity =>
        {
            entity.Property(value => value.UnitCost).HasPrecision(18, 2);
            entity.HasIndex(value => new { value.ItemId, value.ShelfId, value.TransactionDate });
            entity.HasIndex(value => value.ReferenceNumber);
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.Property(value => value.SupplierName).HasMaxLength(200).IsRequired();
            entity.HasIndex(value => value.TinNumber).IsUnique().HasFilter("[TinNumber] IS NOT NULL");
        });

        modelBuilder.Entity<DocumentAttachment>(entity =>
        {
            entity.Property(value => value.FileName).HasMaxLength(260).IsRequired();
            entity.Property(value => value.StoragePath).HasMaxLength(500).IsRequired();
            entity.HasIndex(value => new { value.DocumentType, value.ReferenceId });
        });

        modelBuilder.Entity<DocumentSequence>(entity =>
        {
            entity.HasIndex(value => new { value.DocumentType, value.Year }).IsUnique();
        });

        modelBuilder.Entity<ServiceRequest>(entity =>
        {
            entity.Property(value => value.SrNumber).HasMaxLength(80).IsRequired();
            entity.HasIndex(value => value.SrNumber).IsUnique();
        });

        modelBuilder.Entity<ServiceRequestDetail>(entity =>
        {
            entity.Property(value => value.UnitCost).HasPrecision(18, 2);
        });

        modelBuilder.Entity<PurchaseRequest>(entity =>
        {
            entity.Property(value => value.PrNumber).HasMaxLength(80).IsRequired();
            entity.Property(value => value.EstimatedBudget).HasPrecision(18, 2);
            entity.HasIndex(value => value.PrNumber).IsUnique();
        });

        modelBuilder.Entity<PurchaseRequestDetail>(entity =>
        {
            entity.Property(value => value.UnitCost).HasPrecision(18, 2);
        });

        modelBuilder.Entity<ReceivingNote>(entity =>
        {
            entity.Property(value => value.GrnNumber).HasMaxLength(80).IsRequired();
            entity.Property(value => value.FarnNumber).HasMaxLength(80);
            entity.HasIndex(value => value.GrnNumber).IsUnique();
            entity.HasIndex(value => value.FarnNumber).IsUnique().HasFilter("[FarnNumber] IS NOT NULL");
            entity.HasOne(value => value.InspectionLog)
                .WithOne(value => value.ReceivingNote)
                .HasForeignKey<InspectionLog>(value => value.ReceivingNoteId);
        });

        modelBuilder.Entity<ReceivingNoteDetail>(entity =>
        {
            entity.Property(value => value.UnitCost).HasPrecision(18, 2);
            entity.HasIndex(value => value.TagNumber).IsUnique().HasFilter("[TagNumber] IS NOT NULL");
            entity.HasIndex(value => value.SerialNumber).HasFilter("[SerialNumber] IS NOT NULL");
        });

        modelBuilder.Entity<StoreIssueVoucher>(entity =>
        {
            entity.Property(value => value.SivNumber).HasMaxLength(80).IsRequired();
            entity.Property(value => value.FaivNumber).HasMaxLength(80);
            entity.HasIndex(value => value.SivNumber).IsUnique();
            entity.HasIndex(value => value.FaivNumber).IsUnique().HasFilter("[FaivNumber] IS NOT NULL");
            entity.HasOne(value => value.ServiceRequest)
                .WithOne(value => value.IssueVoucher)
                .HasForeignKey<StoreIssueVoucher>(value => value.ServiceRequestId);
        });

        modelBuilder.Entity<StoreIssueVoucherDetail>(entity =>
        {
            entity.Property(value => value.UnitCost).HasPrecision(18, 2);
        });

        modelBuilder.Entity<PropertyReturn>(entity =>
        {
            entity.Property(value => value.RmrnNumber).HasMaxLength(80).IsRequired();
            entity.HasIndex(value => value.RmrnNumber).IsUnique();
        });

        modelBuilder.Entity<PropertyReturnDetail>(entity =>
        {
            entity.Property(value => value.UnitCost).HasPrecision(18, 2);
        });

        modelBuilder.Entity<PropertyTransfer>(entity =>
        {
            entity.Property(value => value.RmtnNumber).HasMaxLength(80).IsRequired();
            entity.HasIndex(value => value.RmtnNumber).IsUnique();
        });

        modelBuilder.Entity<UserCustody>(entity =>
        {
            entity.HasIndex(value => new { value.CustodianId, value.ItemId, value.TagNumber, value.SerialNumber });
        });

        modelBuilder.Entity<DisposalRecord>(entity =>
        {
            entity.Property(value => value.DisposalNumber).HasMaxLength(80).IsRequired();
            entity.HasIndex(value => value.DisposalNumber).IsUnique();
        });

        modelBuilder.Entity<AnnualInventory>(entity =>
        {
            entity.Property(value => value.InventoryNumber).HasMaxLength(80).IsRequired();
            entity.HasIndex(value => value.InventoryNumber).IsUnique();
            entity.HasIndex(value => new { value.FiscalYear, value.Location });
        });

        modelBuilder.Entity<StockSummaryReport>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("vw_StockSummary");
        });

        modelBuilder.Entity<PropertyMovementReport>(entity =>
        {
            entity.HasNoKey();
            entity.ToView("vw_PropertyMovement");
        });
    }
}
