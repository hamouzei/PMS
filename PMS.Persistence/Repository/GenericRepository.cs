using Microsoft.EntityFrameworkCore;
using PMS.Application.Contracts.IRepository;
using PMS.Application.DTO;
using PMS.Domain.Common;

namespace PMS.Persistence.Repository;

public class GenericRepository<T>(PMSDbContext context) : IGenericRepository<T>
    where T : BaseDomainEntity
{
    public async Task<IReadOnlyList<T>> GetAll(CancellationToken cancellationToken = default)
    {
        return await context.Set<T>()
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<PagedResult<T>> GetPaged(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Clamp(pageSize, 1, 200);

        var query = context.Set<T>().AsNoTracking().OrderBy(entity => entity.CreatedDate);
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<T>(items, pageNumber, pageSize, totalCount);
    }

    public async Task<int> Count(CancellationToken cancellationToken = default)
    {
        return await context.Set<T>().AsNoTracking().CountAsync(cancellationToken);
    }

    public async Task<T?> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<T>().FindAsync([id], cancellationToken);
    }

    public async Task<T> Add(T entity, CancellationToken cancellationToken = default)
    {
        await context.Set<T>().AddAsync(entity, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return entity;
    }

    public async Task Update(T entity, CancellationToken cancellationToken = default)
    {
        context.Set<T>().Update(entity);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task Delete(T entity, CancellationToken cancellationToken = default)
    {
        context.Set<T>().Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> Exists(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Set<T>()
            .AsNoTracking()
            .AnyAsync(entity => entity.Id == id, cancellationToken);
    }

    public void DetachEntity(T entity)
    {
        var entry = context.Entry(entity);

        if (entry.State != EntityState.Detached)
        {
            entry.State = EntityState.Detached;
        }
    }
}
