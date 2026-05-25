-- ============================================================================
-- PMS Database Views
-- Run this script after EF migrations to create the views referenced by
-- PMSDbContext (StockSummaryReport, PropertyMovementReport).
-- ============================================================================

-- FR0019: vw_StockSummary — aggregated stock by item
IF OBJECT_ID('dbo.vw_StockSummary', 'V') IS NOT NULL DROP VIEW dbo.vw_StockSummary;
GO

CREATE VIEW dbo.vw_StockSummary AS
SELECT
    s.ItemId,
    i.Sku,
    i.ItemName,
    i.UnitOfMeasure,
    SUM(s.CurrentQuantity) AS CurrentQuantity,
    SUM(s.ReservedQuantity) AS ReservedQuantity,
    SUM(s.CurrentQuantity - s.ReservedQuantity) AS AvailableQuantity,
    i.MinStockLevel
FROM dbo.InventoryStocks s
INNER JOIN dbo.ItemMasters i ON s.ItemId = i.Id
GROUP BY s.ItemId, i.Sku, i.ItemName, i.UnitOfMeasure, i.MinStockLevel;
GO

-- FR0019: vw_PropertyMovement — stock ledger with item details
IF OBJECT_ID('dbo.vw_PropertyMovement', 'V') IS NOT NULL DROP VIEW dbo.vw_PropertyMovement;
GO

CREATE VIEW dbo.vw_PropertyMovement AS
SELECT
    l.Id AS LedgerId,
    i.ItemName,
    l.ReferenceNumber,
    CAST(l.TransactionType AS NVARCHAR(50)) AS TransactionType,
    l.QuantityChange,
    l.TransactionDate
FROM dbo.StockLedgers l
INNER JOIN dbo.ItemMasters i ON l.ItemId = i.Id;
GO
