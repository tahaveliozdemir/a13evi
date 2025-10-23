import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import type { Child, AppSettings } from '../types';
import { calculateChildStats } from './calculations';

/**
 * Export children data to Excel using ExcelJS (secure)
 */
export async function exportToExcel(children: Child[], settings: AppSettings) {
  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Değerlendirme Raporu');

  // Build period columns from settings
  const periodColumns = settings.periods.map(p => p.name);

  // Define columns
  worksheet.columns = [
    { header: 'İsim', key: 'name', width: 25 },
    { header: 'Toplam Değerlendirme', key: 'totalEval', width: 22 },
    { header: 'Nötr Ortalama', key: 'neutralAvg', width: 18 },
    { header: 'Normal Ortalama', key: 'normalAvg', width: 18 },
    { header: 'Durum', key: 'status', width: 15 },
    ...periodColumns.map(name => ({ header: name, key: name, width: 20 }))
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4B5563' }
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add data rows
  children.forEach(child => {
    const stats = calculateChildStats(child, settings);

    const rowData: any = {
      name: child.name,
      totalEval: child.scores?.length || 0,
      neutralAvg: stats.neutralAvg?.average.toFixed(2) || '-',
      normalAvg: stats.normalAvg?.toFixed(2) || '-',
      status: (stats.neutralAvg?.average || 0) >= settings.threshold ? 'Başarılı' : 'Gelişmeli'
    };

    // Add period data
    settings.periods.forEach((periodDef, index) => {
      const periodStat = stats.periods[index];
      rowData[periodDef.name] = periodStat?.achieved ? 'Kazandı' : 'Devam Ediyor';
    });

    const row = worksheet.addRow(rowData);

    // Color code status
    const statusCell = row.getCell('status');
    if (rowData.status === 'Başarılı') {
      statusCell.font = { color: { argb: 'FF10B981' }, bold: true };
    } else {
      statusCell.font = { color: { argb: 'FFF59E0B' }, bold: true };
    }
  });

  // Generate filename with date
  const date = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
  const filename = `Degerlendirme_Raporu_${date}.xlsx`;

  // Write file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export detailed child report to Excel
 */
export async function exportDetailedExcel(child: Child, settings: AppSettings) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(child.name);

  // Define columns
  const columns = [
    { header: 'Tarih', key: 'date', width: 15 },
    { header: 'Değerlendiren', key: 'evaluator', width: 25 },
    ...settings.categories.map((cat, i) => ({ header: cat, key: `s${i}`, width: 20 }))
  ];

  worksheet.columns = columns;

  // Style header
  worksheet.getRow(1).font = { bold: true, size: 12 };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4B5563' }
  };
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Add data
  child.scores?.forEach(score => {
    const rowData: any = {
      date: new Date(score.date).toLocaleDateString('tr-TR'),
      evaluator: score.evaluator
    };

    settings.categories.forEach((_, index) => {
      const scoreKey = `s${index + 1}` as keyof typeof score;
      rowData[`s${index}`] = score[scoreKey] || '-';
    });

    worksheet.addRow(rowData);
  });

  // Generate filename
  const date = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
  const filename = `${child.name}_Detayli_Rapor_${date}.xlsx`;

  // Write file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export children data to PDF
 */
export function exportToPDF(children: Child[], settings: AppSettings) {
  const doc = new jsPDF();

  let yPos = 20;
  const lineHeight = 10;
  const pageHeight = doc.internal.pageSize.height;

  // Title
  doc.setFontSize(16);
  doc.text('Değerlendirme Raporu', 105, yPos, { align: 'center' });
  yPos += lineHeight * 2;

  // Date
  doc.setFontSize(10);
  doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, yPos);
  yPos += lineHeight * 2;

  // Summary
  doc.setFontSize(12);
  doc.text(`Toplam Çocuk: ${children.length}`, 20, yPos);
  yPos += lineHeight;

  const totalEvaluations = children.reduce((sum, c) => sum + (c.scores?.length || 0), 0);
  doc.text(`Toplam Değerlendirme: ${totalEvaluations}`, 20, yPos);
  yPos += lineHeight * 2;

  // Children list
  doc.setFontSize(14);
  doc.text('Çocuklar:', 20, yPos);
  yPos += lineHeight;

  doc.setFontSize(10);
  children.forEach((child, index) => {
    // Check if need new page
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = 20;
    }

    const stats = calculateChildStats(child, settings);
    const avg = stats.neutralAvg?.average.toFixed(2) || '-';
    const status = (stats.neutralAvg?.average || 0) >= settings.threshold ? 'Başarılı' : 'Gelişmeli';

    doc.text(`${index + 1}. ${child.name}`, 20, yPos);
    doc.text(`Ortalama: ${avg}`, 100, yPos);
    doc.text(`Durum: ${status}`, 150, yPos);
    yPos += lineHeight;
  });

  // Footer
  yPos = pageHeight - 20;
  doc.setFontSize(8);
  doc.text('Gelişim Paneli - Değerlendirme Sistemi', 105, yPos, { align: 'center' });

  // Generate filename
  const date = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
  const filename = `Degerlendirme_Raporu_${date}.pdf`;

  // Save
  doc.save(filename);
}

/**
 * Export detailed child report to PDF
 */
export function exportDetailedPDF(child: Child, settings: AppSettings) {
  const doc = new jsPDF();

  let yPos = 20;
  const lineHeight = 8;
  const pageHeight = doc.internal.pageSize.height;

  // Title
  doc.setFontSize(16);
  doc.text(`${child.name} - Detaylı Rapor`, 105, yPos, { align: 'center' });
  yPos += lineHeight * 2;

  // Date
  doc.setFontSize(10);
  doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, yPos);
  yPos += lineHeight * 2;

  // Statistics
  const stats = calculateChildStats(child, settings);
  doc.setFontSize(12);
  doc.text('Genel İstatistikler:', 20, yPos);
  yPos += lineHeight;

  doc.setFontSize(10);
  doc.text(`Toplam Değerlendirme: ${child.scores?.length || 0}`, 20, yPos);
  yPos += lineHeight;
  doc.text(`Nötr Ortalama: ${stats.neutralAvg?.average.toFixed(2) || '-'}`, 20, yPos);
  yPos += lineHeight;
  doc.text(`Normal Ortalama: ${stats.normalAvg?.toFixed(2) || '-'}`, 20, yPos);
  yPos += lineHeight;
  doc.text(`Durum: ${(stats.neutralAvg?.average || 0) >= settings.threshold ? 'Başarılı' : 'Gelişmeli'}`, 20, yPos);
  yPos += lineHeight * 2;

  // Achievements
  if (stats.periods.length > 0) {
    doc.setFontSize(12);
    doc.text('Kazanımlar:', 20, yPos);
    yPos += lineHeight;

    doc.setFontSize(10);
    settings.periods.forEach((periodDef, index) => {
      const periodStat = stats.periods[index];
      if (periodStat) {
        doc.text(`${periodDef.name}: ${periodStat.achieved ? 'Kazandı ✓' : 'Devam Ediyor'}`, 20, yPos);
        yPos += lineHeight;
      }
    });
    yPos += lineHeight;
  }

  // Evaluation History
  if (child.scores && child.scores.length > 0) {
    doc.setFontSize(12);
    doc.text('Değerlendirme Geçmişi:', 20, yPos);
    yPos += lineHeight * 1.5;

    doc.setFontSize(9);
    child.scores.slice(0, 20).forEach((score, index) => {
      // Check if need new page
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }

      const date = new Date(score.date).toLocaleDateString('tr-TR');
      doc.text(`${index + 1}. ${date} - ${score.evaluator}`, 20, yPos);
      yPos += lineHeight;

      // Category scores
      settings.categories.forEach((category, catIndex) => {
        const scoreKey = `s${catIndex + 1}` as keyof typeof score;
        const scoreValue = score[scoreKey] || '-';
        doc.text(`  ${category}: ${scoreValue}`, 30, yPos);
        yPos += lineHeight;
      });

      yPos += lineHeight * 0.5;
    });
  }

  // Footer on last page
  yPos = pageHeight - 20;
  doc.setFontSize(8);
  doc.text('Gelişim Paneli - Değerlendirme Sistemi', 105, yPos, { align: 'center' });

  // Generate filename
  const date = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
  const filename = `${child.name}_Detayli_Rapor_${date}.pdf`;

  // Save
  doc.save(filename);
}
