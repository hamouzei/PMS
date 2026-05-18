using AutoMapper;
using PMS.Application.DTO;
using PMS.Domain.Entities;

namespace PMS.Application.Profiles;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<CreateCategoryRequest, Category>();
        CreateMap<CreateItemRequest, ItemMaster>();
        CreateMap<CreateUserRequest, AppUser>();
        CreateMap<CreateWarehouseRequest, Warehouse>();
        CreateMap<CreateShelfLocationRequest, ShelfLocation>();
        CreateMap<CreateSupplierRequest, Supplier>();
    }
}
