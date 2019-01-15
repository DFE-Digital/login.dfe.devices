IF NOT EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'device')
  BEGIN
    CREATE TABLE device (
      id uniqueidentifier NOT NULL,
      type varchar(25) NOT NULL,
      serialNumber varchar(25) NOT NULL,
      deactivated bit NOT NULL,
      deactivatedReason nvarchar(max),
      createdAt datetime2 NOT NULL,
      updatedAt datetime2 NOT NULL,

      CONSTRAINT [PK_Device] PRIMARY KEY (id),
      CONSTRAINT [UQ_Device_TypeSerialNumber] UNIQUE (type, serialNumber),
      INDEX [IX_Device_TypeSerialNumber] NONCLUSTERED (type, serialNumber)
    )
  END
GO