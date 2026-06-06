import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate, formatCurrencyWords } from './utils';

export const generateReceiptPDF = (sale: any) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200], // Typical receipt printer width
  });

  const margin = 5;
  let y = 10;

  // Header - Logo Area
  // We can draw a simple professional logo using shapes
  doc.setFillColor(37, 99, 235); // Primary Blue
  doc.roundedRect(33, y, 14, 14, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('S', 40, y + 10, { align: 'center' });
  
  y += 20;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.text('MULTI SAN JUAN', 40, y, { align: 'center' });
  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('SOLUCIONES Y VENTAS', 40, y, { align: 'center' });
  y += 8;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(margin, y, 75, y);
  y += 6;

  // Sale Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBO:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(sale.receiptNumber, 25, y);
  y += 4;
  
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDate(sale.createdAt), 25, y);
  y += 4;
  
  doc.setFont('helvetica', 'bold');
  doc.text('ATENDIÓ:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${sale.user?.firstName} ${sale.user?.lastName || ''}`, 25, y);
  y += 4;

  if (sale.customer) {
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`${sale.customer.firstName} ${sale.customer.lastName || ''}`, 25, y);
    y += 4;
    if (sale.customer.dni) {
      doc.setFont('helvetica', 'bold');
      doc.text('DNI/RUC:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(sale.customer.dni, 25, y);
      y += 4;
    }
  }
  y += 2;
  doc.line(margin, y, 75, y);
  y += 4;

  // Items Table
  const tableData = sale.items.map((item: any) => [
    item.productName,
    item.quantity,
    item.unitPrice.toFixed(2),
    item.total.toFixed(2)
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Cant', 'P.U', 'Total']],
    body: tableData,
    theme: 'plain',
    styles: { fontSize: 7, cellPadding: 0.5 },
    headStyles: { fontStyle: 'bold', lineWidth: 0.1 },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 12, halign: 'right' },
      3: { cellWidth: 13, halign: 'right' },
    }
  });

  y = (doc as any).lastAutoTable.finalY + 5;

  // Totals Area
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  const rightAlignX = 75;
  const labelX = 45;

  doc.text('Subtotal:', labelX, y);
  doc.text(formatCurrency(sale.subtotal), rightAlignX, y, { align: 'right' });
  y += 4;

  if (sale.discount > 0) {
    doc.text('Descuento:', labelX, y);
    doc.text(`-${formatCurrency(sale.discount)}`, rightAlignX, y, { align: 'right' });
    y += 4;
  }

  doc.text('IGV (18%):', labelX, y);
  doc.text(formatCurrency(sale.igv), rightAlignX, y, { align: 'right' });
  y += 5;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', labelX, y);
  doc.text(formatCurrency(sale.total), rightAlignX, y, { align: 'right' });
  y += 6;

  // Son: [letras]
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(`Son: ${formatCurrencyWords(sale.total)}`, margin, y, { maxWidth: 70 });
  y += 8;

  doc.line(margin, y, 75, y);
  y += 5;

  // Payments
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE DE PAGO:', margin, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  sale.payments.forEach((p: any) => {
    doc.text(`${p.method}:`, margin + 2, y);
    doc.text(formatCurrency(p.amount), rightAlignX, y, { align: 'right' });
    y += 4;
  });

  if (sale.notes && sale.notes.includes('Vuelto:')) {
    doc.setFont('helvetica', 'bold');
    doc.text(sale.notes, margin + 2, y);
    y += 6;
  }

  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('¡GRACIAS POR SU PREFERENCIA!', 40, y, { align: 'center' });
  y += 4;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Vuelva pronto', 40, y, { align: 'center' });

  doc.save(`Ticket-${sale.receiptNumber}.pdf`);
};
