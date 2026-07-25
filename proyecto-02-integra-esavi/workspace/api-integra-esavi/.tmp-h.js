const { read, utils } = require('xlsx');
const fs = require('fs');
for (const [f, idxs] of [['./upload_files/files_meddra/report.xlsx',[3]]]) {
  const wb = read(fs.readFileSync(f));
  for (const i of idxs) {
    const rows = utils.sheet_to_json(wb.Sheets[wb.SheetNames[i]], { header:'A', defval:'' });
    console.log('===', f, wb.SheetNames[i], '===');
    for (const [k,v] of Object.entries(rows[0])) console.log(k,'=>',JSON.stringify(v));
    console.log('--- muestra fila 1 ---');
    for (const [k,v] of Object.entries(rows[1]||{})) console.log(k,'=>',JSON.stringify(v).slice(0,120));
  }
}
