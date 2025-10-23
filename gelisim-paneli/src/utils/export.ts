import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import type { Child, AppSettings } from '../types';
import { calculateChildStats } from './calculations';

/**
 * Export children data to Excel
 */
export function exportToExcel(children: Child[], settings: AppSettings) {
  // Prepare data for Excel
  const data = children.map(child => {
    const stats = calculateChildStats(child, settings);

    return {
      'İsim': child.name,
      'Toplam Değerlendirme': child.scores?.length || 0,
      'Nötr Ortalama': stats.neutralAvg?.toFixed(2) || '-',
      'Normal Ortalama': stats.normalAvg?.toFixed(2) || '-',
      'Durum': (stats.neutralAvg || 0) >= settings.threshold ? 'Başarılı' : 'Gelişmeli',
      ...stats.periods.reduce((acc, period) => {
        acc[period.name] = period.achieved ? 'Kazandı' : 'Devam Ediyor';
        return acc;
      }, {} as Record<string, string>)
    };
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 20 }, // İsim
    { wch: 20 }, // Toplam Değerlendirme
    { wch: 15 }, // Nötr Ortalama
    { wch: 15 }, // Normal Ortalama
    { wch: 15 }, // Durum
  ];

  // Add widths for period columns
  settings.periods.forEach(() => {
    colWidths.push({ wch: 20 });
  });

  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Değerlendirme Raporu');

  // Generate filename with date
  const date = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
  const filename = `Degerlendirme_Raporu_${date}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, filename);
}

/**
 * Export detailed child report to Excel
 */
export function exportDetailedExcel(child: Child, settings: AppSettings) {
  const data = child.scores?.map(score => {
    const row: Record<string, any> = {
      'Tarih': new Date(score.date).toLocaleDateString('tr-TR'),
      'Değerlendiren': score.evaluator
    };

    // Add category scores
    settings.categories.forEach((category, index) => {
      const scoreKey = `s${index + 1}` as keyof typeof score;
      row[category] = score[scoreKey] || '-';
    });

    return row;
  }) || [];

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  const colWidths = [
    { wch: 12 }, // Tarih
    { wch: 20 }, // Değerlendiren
  ];

  // Add widths for category columns
  settings.categories.forEach(() => {
    colWidths.push({ wch: 20 });
  });

  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, child.name);

  // Generate filename
  const date = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
  const filename = `${child.name}_Detayli_Rapor_${date}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, filename);
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
    const avg = stats.neutralAvg?.toFixed(2) || '-';
    const status = (stats.neutralAvg || 0) >= settings.threshold ? 'Başarılı' : 'Gelişmeli';

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
  doc.text(`Nötr Ortalama: ${stats.neutralAvg?.toFixed(2) || '-'}`, 20, yPos);
  yPos += lineHeight;
  doc.text(`Normal Ortalama: ${stats.normalAvg?.toFixed(2) || '-'}`, 20, yPos);
  yPos += lineHeight;
  doc.text(`Durum: ${(stats.neutralAvg || 0) >= settings.threshold ? 'Başarılı' : 'Gelişmeli'}`, 20, yPos);
  yPos += lineHeight * 2;

  // Achievements
  if (stats.periods.length > 0) {
    doc.setFontSize(12);
    doc.text('Kazanımlar:', 20, yPos);
    yPos += lineHeight;

    doc.setFontSize(10);
    stats.periods.forEach(period => {
      doc.text(`${period.name}: ${period.achieved ? 'Kazandı ✓' : 'Devam Ediyor'}`, 20, yPos);
      yPos += lineHeight;
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
