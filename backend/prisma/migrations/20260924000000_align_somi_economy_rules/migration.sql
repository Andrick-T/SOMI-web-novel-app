-- Align persisted platform defaults with the approved SOMI economy rules.
UPDATE `PlatformSettings`
SET
  `coinConversionRate` = 4.2,
  `minimumPurchase` = 125;
