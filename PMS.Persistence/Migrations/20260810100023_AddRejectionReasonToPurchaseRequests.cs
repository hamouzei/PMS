using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddRejectionReasonToPurchaseRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ParentWarehouseId",
                table: "Warehouses",
                type: "uniqueidentifier",
                nullable: true);


            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "PurchaseRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BudgetAllocations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FiscalYear = table.Column<int>(type: "int", nullable: false),
                    Department = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Division = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    AllocatedAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    UtilizedAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BudgetAllocations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ComplianceRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ComplianceNumber = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    InventoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReviewedById = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Findings = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Recommendations = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CorrectiveActions = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReviewDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComplianceRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComplianceRecords_AnnualInventories_InventoryId",
                        column: x => x.InventoryId,
                        principalTable: "AnnualInventories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ComplianceRecords_Users_ReviewedById",
                        column: x => x.ReviewedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PropertyFields",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FieldName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    FieldType = table.Column<int>(type: "int", nullable: false),
                    IsRequired = table.Column<bool>(type: "bit", nullable: false),
                    ApplicablePropertyType = table.Column<int>(type: "int", nullable: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    Options = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyFields", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PropertyHandovers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HandoverNumber = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    HandoverFromId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HandoverToId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuthorizedById = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    HandoverDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Purpose = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FromLocation = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ToLocation = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyHandovers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropertyHandovers_Users_AuthorizedById",
                        column: x => x.AuthorizedById,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PropertyHandovers_Users_HandoverFromId",
                        column: x => x.HandoverFromId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PropertyHandovers_Users_HandoverToId",
                        column: x => x.HandoverToId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SafetyBoxes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BoxNumber = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    WarehouseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TotalShelves = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SafetyBoxes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SafetyBoxes_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PropertyFieldValues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PropertyFieldId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyFieldValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropertyFieldValues_ItemMasters_ItemId",
                        column: x => x.ItemId,
                        principalTable: "ItemMasters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PropertyFieldValues_PropertyFields_PropertyFieldId",
                        column: x => x.PropertyFieldId,
                        principalTable: "PropertyFields",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PropertyHandoverDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PropertyHandoverId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    TagNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SerialNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FarnNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RmrnNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FaivNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyHandoverDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropertyHandoverDetails_ItemMasters_ItemId",
                        column: x => x.ItemId,
                        principalTable: "ItemMasters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PropertyHandoverDetails_PropertyHandovers_PropertyHandoverId",
                        column: x => x.PropertyHandoverId,
                        principalTable: "PropertyHandovers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SafetyBoxShelves",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SafetyBoxId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShelfLabel = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    WeightCapacity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    VolumeCapacity = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    ShelfLocationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SafetyBoxShelves", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SafetyBoxShelves_SafetyBoxes_SafetyBoxId",
                        column: x => x.SafetyBoxId,
                        principalTable: "SafetyBoxes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SafetyBoxShelves_ShelfLocations_ShelfLocationId",
                        column: x => x.ShelfLocationId,
                        principalTable: "ShelfLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Warehouses_ParentWarehouseId",
                table: "Warehouses",
                column: "ParentWarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_BudgetAllocations_FiscalYear_Department_Division",
                table: "BudgetAllocations",
                columns: new[] { "FiscalYear", "Department", "Division" },
                unique: true,
                filter: "[Department] IS NOT NULL AND [Division] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ComplianceRecords_ComplianceNumber",
                table: "ComplianceRecords",
                column: "ComplianceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ComplianceRecords_InventoryId",
                table: "ComplianceRecords",
                column: "InventoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ComplianceRecords_ReviewedById",
                table: "ComplianceRecords",
                column: "ReviewedById");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyFields_FieldName",
                table: "PropertyFields",
                column: "FieldName",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PropertyFieldValues_ItemId",
                table: "PropertyFieldValues",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyFieldValues_PropertyFieldId_ItemId",
                table: "PropertyFieldValues",
                columns: new[] { "PropertyFieldId", "ItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PropertyHandoverDetails_ItemId",
                table: "PropertyHandoverDetails",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyHandoverDetails_PropertyHandoverId",
                table: "PropertyHandoverDetails",
                column: "PropertyHandoverId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyHandovers_AuthorizedById",
                table: "PropertyHandovers",
                column: "AuthorizedById");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyHandovers_HandoverFromId",
                table: "PropertyHandovers",
                column: "HandoverFromId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyHandovers_HandoverNumber",
                table: "PropertyHandovers",
                column: "HandoverNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PropertyHandovers_HandoverToId",
                table: "PropertyHandovers",
                column: "HandoverToId");

            migrationBuilder.CreateIndex(
                name: "IX_SafetyBoxes_BoxNumber",
                table: "SafetyBoxes",
                column: "BoxNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SafetyBoxes_WarehouseId",
                table: "SafetyBoxes",
                column: "WarehouseId");

            migrationBuilder.CreateIndex(
                name: "IX_SafetyBoxShelves_SafetyBoxId",
                table: "SafetyBoxShelves",
                column: "SafetyBoxId");

            migrationBuilder.CreateIndex(
                name: "IX_SafetyBoxShelves_ShelfLocationId",
                table: "SafetyBoxShelves",
                column: "ShelfLocationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Warehouses_Warehouses_ParentWarehouseId",
                table: "Warehouses",
                column: "ParentWarehouseId",
                principalTable: "Warehouses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Warehouses_Warehouses_ParentWarehouseId",
                table: "Warehouses");

            migrationBuilder.DropTable(
                name: "BudgetAllocations");

            migrationBuilder.DropTable(
                name: "ComplianceRecords");

            migrationBuilder.DropTable(
                name: "PropertyFieldValues");

            migrationBuilder.DropTable(
                name: "PropertyHandoverDetails");

            migrationBuilder.DropTable(
                name: "SafetyBoxShelves");

            migrationBuilder.DropTable(
                name: "PropertyFields");

            migrationBuilder.DropTable(
                name: "PropertyHandovers");

            migrationBuilder.DropTable(
                name: "SafetyBoxes");

            migrationBuilder.DropIndex(
                name: "IX_Warehouses_ParentWarehouseId",
                table: "Warehouses");

            migrationBuilder.DropColumn(
                name: "ParentWarehouseId",
                table: "Warehouses");


            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "PurchaseRequests");
        }
    }
}
