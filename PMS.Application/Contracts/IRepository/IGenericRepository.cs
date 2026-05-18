using PMS.Application.DTO;
using PMS.Domain.Common;

namespace PMS.Application.Contracts.IRepository;

public interface IGenericRepository<T> where T : BaseDomainEntity
{
    Task<IReadOnlyList<T>> GetAll(CancellationToken cancellationToken = default);
    Task<PagedResult<T>> GetPaged(int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<int> Count(CancellationToken cancellationToken = default);
    Task<T?> GetById(Guid id, CancellationToken cancellationToken = default);
    Task<T> Add(T entity, CancellationToken cancellationToken = default);
    Task Update(T entity, CancellationToken cancellationToken = default);
    Task Delete(T entity, CancellationToken cancellationToken = default);
    Task<bool> Exists(Guid id, CancellationToken cancellationToken = default);
    void DetachEntity(T entity);
}
