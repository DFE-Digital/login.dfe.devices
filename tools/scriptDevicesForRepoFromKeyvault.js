const { getAllDigipass, getDigipassDetails } = require('./../src/infrastructure/deviceStorage');

const script = async () => {
  const correlationId = `scriptDevicesForRepoFromKeyvault-${Date.now()}`;
  console.info('Reading serial numbers');
  const serialNumbers = await getAllDigipass(correlationId);
  let sql = '';
  for (let i = 0; i < serialNumbers.length; i += 1) {
    const serialNumber = serialNumbers[i].serialNumber;
    console.info(`Scripting ${i} of ${serialNumbers.length} (${serialNumber})`);

    const details = await getDigipassDetails(serialNumber, correlationId);
    const deactivated = details.deactivated ? 1 : 0;
    const deactivatedReason = details.deactivatedReason ? `'${details.deactivatedReason}'` : 'NULL';

    sql += `INSERT INTO device (id, type, serialNumber, deactivated, deactivatedReason, createdAt, updatedAt) VALUES (NEWID(), 'digipass', '${details.serialNumber}', ${deactivated}, ${deactivatedReason}, GETDATE(), GETDATE());\n`;
  }

  console.info(sql);
};
script().then(() => {
  console.info('done');
}).catch((e) => {
  console.error(e.stack);
}).then(() => {
  process.exit();
});
