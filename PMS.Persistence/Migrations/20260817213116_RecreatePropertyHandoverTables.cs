using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMS.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RecreatePropertyHandoverTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The old PropertyHandovers / PropertyHandoverDetails tables were created
            // manually with a different column schema (FromCustodianId, ToCustodianId, etc.)
            // and have been dropped. This migration recreates them with the correct schema
            // that matches the EF entities.

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
                IF OBJECT_ID(N'[PropertyHandoverDetails]', 'U') IS NULL
                BEGIN
                    CREATE TABLE [PropertyHandoverDetails] (
                        [Id]                 uniqueidentifier NOT NULL,
                        [PropertyHandoverId] uniqueidentifier NOT NULL,
                        [ItemId]             uniqueidentifier NOT NULL,
                        [Quantity]           int              NOT NULL,
                        [TagNumber]          nvarchar(max)    NULL,
                        [SerialNumber]       nvarchar(max)    NULL,
                        [FarnNumber]         nvarchar(max)    NULL,
                        [RmrnNumber]         nvarchar(max)    NULL,
                        [FaivNumber]         nvarchar(max)    NULL,
                        [CreatedDate]        datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [UpdatedDate]        datetime2        NOT NULL DEFAULT (SYSUTCDATETIME()),
                        [CreatedBy]          nvarchar(max)    NULL,
                        [UpdatedBy]          nvarchar(max)    NULL,
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
                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyHandovers]') AND name = N'IX_PropertyHandovers_AuthorizedById')
                    CREATE INDEX [IX_PropertyHandovers_AuthorizedById] ON [PropertyHandovers] ([AuthorizedById]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyHandovers]') AND name = N'IX_PropertyHandovers_HandoverFromId')
                    CREATE INDEX [IX_PropertyHandovers_HandoverFromId] ON [PropertyHandovers] ([HandoverFromId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyHandovers]') AND name = N'IX_PropertyHandovers_HandoverNumber')
                    CREATE UNIQUE INDEX [IX_PropertyHandovers_HandoverNumber] ON [PropertyHandovers] ([HandoverNumber]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyHandovers]') AND name = N'IX_PropertyHandovers_HandoverToId')
                    CREATE INDEX [IX_PropertyHandovers_HandoverToId] ON [PropertyHandovers] ([HandoverToId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyHandoverDetails]') AND name = N'IX_PropertyHandoverDetails_ItemId')
                    CREATE INDEX [IX_PropertyHandoverDetails_ItemId] ON [PropertyHandoverDetails] ([ItemId]);

                IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'[PropertyHandoverDetails]') AND name = N'IX_PropertyHandoverDetails_PropertyHandoverId')
                    CREATE INDEX [IX_PropertyHandoverDetails_PropertyHandoverId] ON [PropertyHandoverDetails] ([PropertyHandoverId]);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "PropertyHandoverDetails");
            migrationBuilder.DropTable(name: "PropertyHandovers");
        }
    }
}
