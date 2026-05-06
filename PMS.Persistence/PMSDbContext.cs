using Microsoft.EntityFrameworkCore;
using PMS.Domain.Common;

namespace PMS.Persistence;

public class PMSDbContext(DbContextOptions<PMSDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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
}
