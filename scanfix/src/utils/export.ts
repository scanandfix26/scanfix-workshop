import type { Job } from '../types';

const HEADERS = [
  'Job Number', 'Bike Number', 'Bike Model', 'Phone', 'Customer Name',
  'Complaint', 'Problems', 'Repair Notes', 'Parts Used', 'Labour', 'Parts Cost',
  'Other Cost', 'Total Bill', 'Final Work Done', 'Status', 'Created Date', 'Completed Date',
];

function jobToRow(job: Job): string[] {
  return [
    job.jobNumber,
    job.bikeNumber,
    job.bikeModel || '',
    job.customerPhone,
    job.customerName || '',
    job.complaint || '',
    job.problems.join('; '),
    job.repairNotes || '',
    job.spareParts.map(p => `${p.name} x${p.quantity}${p.amount ? ` ₹${p.amount}` : ''}`).join('; '),
    String(job.bill?.labour || 0),
    String(job.bill?.parts || 0),
    String(job.bill?.other || 0),
    String(job.bill?.total || 0),
    job.finalWorkDone || '',
    job.status,
    new Date(job.createdAt).toLocaleDateString('en-IN'),
    job.completedAt ? new Date(job.completedAt).toLocaleDateString('en-IN') : '',
  ];
}

export function exportCSV(jobs: Job[], filename = 'scanfix-records') {
  const rows = [HEADERS, ...jobs.map(jobToRow)];
  const csv  = rows.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

export async function exportPDF(jobs: Job[], filename = 'scanfix-records') {
  const { default: jsPDF }    = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text('Scan & Fix — Workshop Register', 14, 14);
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Exported: ${new Date().toLocaleString('en-IN')}   Total Jobs: ${jobs.length}`, 14, 20);

  autoTable(doc, {
    head: [HEADERS],
    body: jobs.map(jobToRow),
    startY: 25,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [245, 180, 0], textColor: [30, 30, 30], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  doc.save(`${filename}.pdf`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
