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
            // Guard: only add the column if it doesn't already exist (idempotent)
            migrationBuilder.Sql(
                """
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'[Warehouses]') AND name = N'ParentWarehouseId'
                )
                BEGIN
                    ALTER TABLE [Warehouses] ADD [ParentWarehouseId] uniqueidentifier NULL;
                END
                """);

            // Guard: only add the column if it doesn't already exist (idempotent)
            migrationBuilder.Sql(
                """
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID(N'[PurchaseRequests]') AND name = N'RejectionReason'
                )
                BEGIN
                    ALTER TABLE [PurchaseRequests] ADD [RejectionReason] nvarchar(max) NULL;
                END
                """);

            // ── Idempotent table + index creation ─────────────────────────────────
            // All tables and indexes below are guarded with IF OBJECT_ID / IF NOT EXISTS
            // because some objects may have been created manually before this migration ran.

            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[BudgetAllocations]', 'U') IS NULL
                BEGIN
                    CREATE TABLE [BudgetAllocations] (
                        [Id]              uniqueidentifier NOT NULL,
                        [FiscalYear]      int              NOT NULL,
                        [Department]      nvarchar(450)    NULL,
                        [Division]        nvarchar(450)    NULL,
                        [AllocatedAmount] decimal(18,2)    NOT NULL,
                        [UtilizedAmount]  decimal(18,2)    NOT NULL,
                        [CreatedDate]     datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [UpdatedDate]     datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [CreatedBy]       nvarchar(max)    NULL,
                        [UpdatedBy]       nvarchar(max)    NULL,
                        CONSTRAINT [PK_BudgetAllocations] PRIMARY KEY ([Id])
                    );
                END
                """);

            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[ComplianceRecords]', 'U') IS NULL
                BEGIN
                    CREATE TABLE [ComplianceRecords] (
                        [Id]               uniqueidentifier NOT NULL,
                        [ComplianceNumber] nvarchar(80)     NOT NULL,
                        [InventoryId]      uniqueidentifier NULL,
                        [ReviewedById]     uniqueidentifier NOT NULL,
                        [Status]           int              NOT NULL,
                        [Findings]         nvarchar(max)    NULL,
                        [Recommendations]  nvarchar(max)    NULL,
                        [CorrectiveActions] nvarchar(max)   NULL,
                        [ReviewDate]       datetime2        NOT NULL,
                        [CreatedDate]      datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [UpdatedDate]      datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [CreatedBy]        nvarchar(max)    NULL,
                        [UpdatedBy]        nvarchar(max)    NULL,
                        CONSTRAINT [PK_ComplianceRecords] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_ComplianceRecords_AnnualInventories_InventoryId]
                            FOREIGN KEY ([InventoryId]) REFERENCES [AnnualInventories] ([Id]) ON DELETE NO ACTION,
                        CONSTRAINT [FK_ComplianceRecords_Users_ReviewedById]
                            FOREIGN KEY ([ReviewedById]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
                    );
                END
                """);

            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[PropertyFields]', 'U') IS NULL
                BEGIN
                    CREATE TABLE [PropertyFields] (
                        [Id]                     uniqueidentifier NOT NULL,
                        [FieldName]              nvarchar(150)    NOT NULL,
                        [FieldType]              int              NOT NULL,
                        [IsRequired]             bit              NOT NULL,
                        [ApplicablePropertyType] int              NULL,
                        [DisplayOrder]           int              NOT NULL,
                        [Options]                nvarchar(max)    NULL,
                        [IsActive]               bit              NOT NULL,
                        [CreatedDate]            datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [UpdatedDate]            datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [CreatedBy]              nvarchar(max)    NULL,
                        [UpdatedBy]              nvarchar(max)    NULL,
                        CONSTRAINT [PK_PropertyFields] PRIMARY KEY ([Id])
                    );
                END
                """);

            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[PropertyHandovers]', 'U') IS NULL
                BEGIN
                    CREATE TABLE [PropertyHandovers] (
                        [Id]             uniqueidentifier NOT NULL,
                        [HandoverNumber] nvarchar(80)     NOT NULL,
                        [HandoverFromId] uniqueidentifier NOT NULL,
                        [HandoverToId]   uniqueidentifier NOT NULL,
                        [AuthorizedById] uniqueidentifier NULL,
                        [HandoverDate]   datetime2        NOT NULL,
                        [Status]         int              NOT NULL,
                        [Purpose]        nvarchar(max)    NULL,
                        [FromLocation]   nvarchar(max)    NULL,
                        [ToLocation]     nvarchar(max)    NULL,
                        [Remarks]        nvarchar(max)    NULL,
                        [CreatedDate]    datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [UpdatedDate]    datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [CreatedBy]      nvarchar(max)    NULL,
                        [UpdatedBy]      nvarchar(max)    NULL,
                        CONSTRAINT [PK_PropertyHandovers] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_PropertyHandovers_Users_AuthorizedById]
                            FOREIGN KEY ([AuthorizedById]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
                        CONSTRAINT [FK_PropertyHandovers_Users_HandoverFromId]
                            FOREIGN KEY ([HandoverFromId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION,
                        CONSTRAINT [FK_PropertyHandovers_Users_HandoverToId]
                            FOREIGN KEY ([HandoverToId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
                    );
                END
                """);

            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[SafetyBoxes]', 'U') IS NULL
                BEGIN
                    CREATE TABLE [SafetyBoxes] (
                        [Id]           uniqueidentifier NOT NULL,
                        [BoxNumber]    nvarchar(80)     NOT NULL,
                        [WarehouseId]  uniqueidentifier NOT NULL,
                        [Description]  nvarchar(max)    NULL,
                        [Category]     nvarchar(max)    NULL,
                        [TotalShelves] int              NOT NULL,
                        [IsActive]     bit              NOT NULL,
                        [CreatedDate]  datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [UpdatedDate]  datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [CreatedBy]    nvarchar(max)    NULL,
                        [UpdatedBy]    nvarchar(max)    NULL,
                        CONSTRAINT [PK_SafetyBoxes] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_SafetyBoxes_Warehouses_WarehouseId]
                            FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE NO ACTION
                    );
                END
                """);

            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[PropertyFieldValues]', 'U') IS NULL
                BEGIN
                    CREATE TABLE [PropertyFieldValues] (
                        [Id]              uniqueidentifier NOT NULL,
                        [PropertyFieldId] uniqueidentifier NOT NULL,
                        [ItemId]          uniqueidentifier NOT NULL,
                        [Value]           nvarchar(max)    NOT NULL,
                        [CreatedDate]     datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [UpdatedDate]     datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [CreatedBy]       nvarchar(max)    NULL,
                        [UpdatedBy]       nvarchar(max)    NULL,
                        CONSTRAINT [PK_PropertyFieldValues] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_PropertyFieldValues_ItemMasters_ItemId]
                            FOREIGN KEY ([ItemId]) REFERENCES [ItemMasters] ([Id]) ON DELETE NO ACTION,
                        CONSTRAINT [FK_PropertyFieldValues_PropertyFields_PropertyFieldId]
                            FOREIGN KEY ([PropertyFieldId]) REFERENCES [PropertyFields] ([Id]) ON DELETE NO ACTION
                    );
                END
                """);

            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[PropertyHandoverDetails]', 'U') IS NULL
                BEGIN
                    CREATE TABLE [PropertyHandoverDetails] (
                        [Id]                uniqueidentifier NOT NULL,
                        [PropertyHandoverId] uniqueidentifier NOT NULL,
                        [ItemId]            uniqueidentifier NOT NULL,
                        [Quantity]          int              NOT NULL,
                        [TagNumber]         nvarchar(max)    NULL,
                        [SerialNumber]      nvarchar(max)    NULL,
                        [FarnNumber]        nvarchar(max)    NULL,
                        [RmrnNumber]        nvarchar(max)    NULL,
                        [FaivNumber]        nvarchar(max)    NULL,
                        [CreatedDate]       datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [UpdatedDate]       datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [CreatedBy]         nvarchar(max)    NULL,
                        [UpdatedBy]         nvarchar(max)    NULL,
                        CONSTRAINT [PK_PropertyHandoverDetails] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_PropertyHandoverDetails_ItemMasters_ItemId]
                            FOREIGN KEY ([ItemId]) REFERENCES [ItemMasters] ([Id]) ON DELETE NO ACTION,
                        CONSTRAINT [FK_PropertyHandoverDetails_PropertyHandovers_PropertyHandoverId]
                            FOREIGN KEY ([PropertyHandoverId]) REFERENCES [PropertyHandovers] ([Id]) ON DELETE NO ACTION
                    );
                END
                """);

            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[SafetyBoxShelves]', 'U') IS NULL
                BEGIN
                    CREATE TABLE [SafetyBoxShelves] (
                        [Id]              uniqueidentifier NOT NULL,
                        [SafetyBoxId]     uniqueidentifier NOT NULL,
                        [ShelfLabel]      nvarchar(80)     NOT NULL,
                        [WeightCapacity]  decimal(18,2)    NULL,
                        [VolumeCapacity]  decimal(18,2)    NULL,
                        [ShelfLocationId] uniqueidentifier NULL,
                        [CreatedDate]     datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [UpdatedDate]     datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [CreatedBy]       nvarchar(max)    NULL,
                        [UpdatedBy]       nvarchar(max)    NULL,
                        CONSTRAINT [PK_SafetyBoxShelves] PRIMARY KEY ([Id]),
                        CONSTRAINT [FK_SafetyBoxShelves_SafetyBoxes_SafetyBoxId]
                            FOREIGN KEY ([SafetyBoxId]) REFERENCES [SafetyBoxes] ([Id]) ON DELETE NO ACTION,
                        CONSTRAINT [FK_SafetyBoxShelves_ShelfLocations_ShelfLocationId]
                            FOREIGN KEY ([ShelfLocationId]) REFERENCES [ShelfLocations] ([Id]) ON DELETE NO ACTION
                    );
                END
                """);

            // ── Idempotent index creation (all guarded with index + column existence) ──
            migrationBuilder.Sql(
                """
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[Warehouses]') AND name = N'IX_Warehouses_ParentWarehouseId')
                AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[Warehouses]') AND name = N'ParentWarehouseId')
                    CREATE INDEX [IX_Warehouses_ParentWarehouseId] ON [Warehouses] ([ParentWarehouseId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[BudgetAllocations]') AND name = N'IX_BudgetAllocations_FiscalYear_Department_Division')
                    CREATE UNIQUE INDEX [IX_BudgetAllocations_FiscalYear_Department_Division] ON [BudgetAllocations] ([FiscalYear], [Department], [Division]) WHERE [Department] IS NOT NULL AND [Division] IS NOT NULL;

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[ComplianceRecords]') AND name = N'IX_ComplianceRecords_ComplianceNumber')
                    CREATE UNIQUE INDEX [IX_ComplianceRecords_ComplianceNumber] ON [ComplianceRecords] ([ComplianceNumber]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[ComplianceRecords]') AND name = N'IX_ComplianceRecords_InventoryId')
                    CREATE INDEX [IX_ComplianceRecords_InventoryId] ON [ComplianceRecords] ([InventoryId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[ComplianceRecords]') AND name = N'IX_ComplianceRecords_ReviewedById')
                    CREATE INDEX [IX_ComplianceRecords_ReviewedById] ON [ComplianceRecords] ([ReviewedById]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyFields]') AND name = N'IX_PropertyFields_FieldName')
                    CREATE UNIQUE INDEX [IX_PropertyFields_FieldName] ON [PropertyFields] ([FieldName]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyFieldValues]') AND name = N'IX_PropertyFieldValues_ItemId')
                AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[PropertyFieldValues]') AND name = N'ItemId')
                    CREATE INDEX [IX_PropertyFieldValues_ItemId] ON [PropertyFieldValues] ([ItemId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyFieldValues]') AND name = N'IX_PropertyFieldValues_PropertyFieldId_ItemId')
                AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[PropertyFieldValues]') AND name = N'PropertyFieldId')
                    CREATE UNIQUE INDEX [IX_PropertyFieldValues_PropertyFieldId_ItemId] ON [PropertyFieldValues] ([PropertyFieldId], [ItemId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyHandoverDetails]') AND name = N'IX_PropertyHandoverDetails_ItemId')
                AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[PropertyHandoverDetails]') AND name = N'ItemId')
                    CREATE INDEX [IX_PropertyHandoverDetails_ItemId] ON [PropertyHandoverDetails] ([ItemId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyHandoverDetails]') AND name = N'IX_PropertyHandoverDetails_PropertyHandoverId')
                AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[PropertyHandoverDetails]') AND name = N'PropertyHandoverId')
                    CREATE INDEX [IX_PropertyHandoverDetails_PropertyHandoverId] ON [PropertyHandoverDetails] ([PropertyHandoverId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyHandovers]') AND name = N'IX_PropertyHandovers_AuthorizedById')
                AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[PropertyHandovers]') AND name = N'AuthorizedById')
                    CREATE INDEX [IX_PropertyHandovers_AuthorizedById] ON [PropertyHandovers] ([AuthorizedById]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyHandovers]') AND name = N'IX_PropertyHandovers_HandoverFromId')
                AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[PropertyHandovers]') AND name = N'HandoverFromId')
                    CREATE INDEX [IX_PropertyHandovers_HandoverFromId] ON [PropertyHandovers] ([HandoverFromId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyHandovers]') AND name = N'IX_PropertyHandovers_HandoverNumber')
                AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[PropertyHandovers]') AND name = N'HandoverNumber')
                    CREATE UNIQUE INDEX [IX_PropertyHandovers_HandoverNumber] ON [PropertyHandovers] ([HandoverNumber]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyHandovers]') AND name = N'IX_PropertyHandovers_HandoverToId')
                AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[PropertyHandovers]') AND name = N'HandoverToId')
                    CREATE INDEX [IX_PropertyHandovers_HandoverToId] ON [PropertyHandovers] ([HandoverToId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[SafetyBoxes]') AND name = N'IX_SafetyBoxes_BoxNumber')
                    CREATE UNIQUE INDEX [IX_SafetyBoxes_BoxNumber] ON [SafetyBoxes] ([BoxNumber]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[SafetyBoxes]') AND name = N'IX_SafetyBoxes_WarehouseId')
                    CREATE INDEX [IX_SafetyBoxes_WarehouseId] ON [SafetyBoxes] ([WarehouseId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[SafetyBoxShelves]') AND name = N'IX_SafetyBoxShelves_SafetyBoxId')
                    CREATE INDEX [IX_SafetyBoxShelves_SafetyBoxId] ON [SafetyBoxShelves] ([SafetyBoxId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[SafetyBoxShelves]') AND name = N'IX_SafetyBoxShelves_ShelfLocationId')
                    CREATE INDEX [IX_SafetyBoxShelves_ShelfLocationId] ON [SafetyBoxShelves] ([ShelfLocationId]);
                """);


            // Guard: only add FK if it doesn't already exist
            migrationBuilder.Sql(
                """
                IF NOT EXISTS (
                    SELECT 1 FROM sys.foreign_keys
                    WHERE name = N'FK_Warehouses_Warehouses_ParentWarehouseId'
                      AND parent_object_id = OBJECT_ID(N'[Warehouses]')
                )
                BEGIN
                    ALTER TABLE [Warehouses] ADD CONSTRAINT [FK_Warehouses_Warehouses_ParentWarehouseId]
                        FOREIGN KEY ([ParentWarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE NO ACTION;
                END
                """);

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
