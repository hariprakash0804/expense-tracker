import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './helpers';

export const exportExpensesToPDF = (expenses, user, dateRange = null) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = user?.currency || 'INR';

  // Total summary calculations
  const totalAmount = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const count = expenses.length;
  
  // Category breakdown calculations
  const categories = {};
  expenses.forEach(e => {
    categories[e.category] = (categories[e.category] || 0) + parseFloat(e.amount);
  });
  const categoryRows = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => [cat, formatCurrency(amt, currency), `${((amt / totalAmount) * 100).toFixed(0)}%`]);

  // Page dimensions
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Add Page Background Gradient/Accent (Left subtle strip)
  doc.setFillColor(99, 102, 241); // Indigo color
  doc.rect(0, 0, 5, pageHeight, 'F');

  // Header Typography
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(17, 24, 39); // Slate 900
  doc.text('Expense Statement', 15, 20);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // Slate 500
  
  const generatedText = `Generated on: ${formatDate(new Date())}`;
  doc.text(generatedText, 15, 26);

  if (dateRange && (dateRange.startDate || dateRange.endDate)) {
    const rangeText = `Period: ${dateRange.startDate ? formatDate(dateRange.startDate) : 'Beginning'} to ${dateRange.endDate ? formatDate(dateRange.endDate) : 'Today'}`;
    doc.text(rangeText, 15, 31);
  }

  // Draw Separator Line
  doc.setDrawColor(229, 231, 235); // Border gray
  doc.setLineWidth(0.5);
  doc.line(15, 36, pageWidth - 15, 36);

  // Summary Metrics Banner Block
  doc.setFillColor(243, 244, 246); // Background light gray
  doc.roundedRect(15, 42, pageWidth - 30, 24, 3, 3, 'F');

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('STATEMENT ACCOUNT OWNER', 20, 48);
  doc.text('TOTAL SPENT', 100, 48);
  doc.text('TOTAL TRANSACTIONS', 155, 48);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(user?.name || 'Valued User', 20, 56);

  doc.setFontSize(14);
  doc.setTextColor(239, 68, 68); // Red Accent
  doc.text(formatCurrency(totalAmount, currency), 100, 56);

  doc.setFontSize(12);
  doc.setTextColor(99, 102, 241);
  doc.text(count.toString(), 155, 56);

  // 1. Category Summary Table
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text('Category Summary', 15, 76);

  autoTable(doc, {
    startY: 81,
    margin: { left: 15, right: 15 },
    head: [['Category', 'Amount Spent', 'Percentage']],
    body: categoryRows,
    theme: 'striped',
    headStyles: { fillStyle: 'F', fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 50, halign: 'right' },
      2: { cellWidth: 50, halign: 'right' }
    }
  });

  // 2. Detailed Transactions Table
  const lastY = doc.lastAutoTable.finalY || 100;
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text('Transaction Details', 15, lastY + 12);

  const transactionHeaders = ['Date', 'Description', 'Category', 'Payment Method', 'Amount'];
  const transactionRows = expenses.map(e => [
    formatDate(e.date),
    e.description,
    e.category,
    e.paymentMethod || e.payment_method || 'Cash',
    formatCurrency(e.amount, e.currency || currency)
  ]);

  autoTable(doc, {
    startY: lastY + 17,
    margin: { left: 15, right: 15 },
    head: [transactionHeaders],
    body: transactionRows,
    theme: 'striped',
    headStyles: { fillColor: [75, 85, 99], textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 65 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25, halign: 'right' }
    }
  });

  // Add Page Numbers in Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    
    // Page count text
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
    // Secure app footnote
    doc.text('ExpenseTracker — Your Personal Financial Dashboard', 15, pageHeight - 10);
  }

  // Save the report
  doc.save(`Financial_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
