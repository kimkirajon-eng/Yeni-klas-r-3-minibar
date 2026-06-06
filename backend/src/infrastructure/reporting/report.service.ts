import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import path from 'path';

const FONT_DIR = path.join(__dirname, '..', '..', 'infrastructure', 'reporting', 'fonts');

const BRAND_PRIMARY = '1a73e8';
const BRAND_DARK = '1a1f36';
const BRAND_HEADER = '1A73E8';
const BORDER_COLOR = 'dadce0';

export class ReportService {
  constructor(private prisma: PrismaClient) {}

  async generateExcelReport(res: Response, blockId?: string, floorId?: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const roomWhere: any = {};
    if (blockId) roomWhere.blockId = blockId;
    if (floorId) roomWhere.floorId = floorId;

    const rooms = await this.prisma.room.findMany({
      where: roomWhere,
      include: { block: true, floor: true },
      orderBy: [{ block: { name: 'asc' } }, { name: 'asc' }],
    });

    const roomIds = rooms.map((r) => r.id);
    const logWhere: any = { performedAt: { gte: today } };
    if (roomIds.length > 0) logWhere.roomId = { in: roomIds };

    const logs = await this.prisma.minibarLog.findMany({
      where: logWhere,
      include: {
        room: { include: { block: true, floor: true } },
        product: true,
        personnel: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ room: { block: { name: 'asc' } } }, { room: { name: 'asc' } }, { performedAt: 'asc' }],
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Hotel Minibar Yönetim Sistemi';
    workbook.created = new Date();

    const addTitleRow = (ws: ExcelJS.Worksheet, title: string, mergeTo: number) => {
      const row = ws.addRow([title]);
      row.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFF' } };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_HEADER } };
      row.alignment = { horizontal: 'center', vertical: 'middle' };
      row.height = 32;
      ws.mergeCells(1, 1, 1, mergeTo);
    };

    const addHeaderRow = (ws: ExcelJS.Worksheet, headers: string[], startRow: number) => {
      const row = ws.getRow(startRow);
      headers.forEach((h, i) => {
        const cell = row.getCell(i + 1);
        cell.value = h;
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A73E8' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: BORDER_COLOR } },
          bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
          left: { style: 'thin', color: { argb: BORDER_COLOR } },
          right: { style: 'thin', color: { argb: BORDER_COLOR } },
        };
      });
      row.height = 24;
    };

    const addDataRow = (ws: ExcelJS.Worksheet, rowNum: number, data: any[], isAlt: boolean) => {
      const row = ws.getRow(rowNum);
      data.forEach((val, i) => {
        const cell = row.getCell(i + 1);
        cell.value = val;
        cell.font = { name: 'Calibri', size: 10, color: { argb: '333333' } };
        cell.alignment = typeof val === 'number' ? { horizontal: 'right', vertical: 'middle' } : { horizontal: 'left', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: BORDER_COLOR } },
          bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
          left: { style: 'thin', color: { argb: BORDER_COLOR } },
          right: { style: 'thin', color: { argb: BORDER_COLOR } },
        };
        if (isAlt) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } };
        }
      });
    };

    /* ---- Sheet 1: Gün Sonu Özeti ---- */
    const s1 = workbook.addWorksheet('Gün Sonu Özeti');
    (s1 as any).properties.tabColor = { argb: BRAND_PRIMARY };

    addTitleRow(s1, 'HOTEL MİNİBAR YÖNETİM SİSTEMİ — GÜN SONU ÖZETİ', 2);
    const metaRow = s1.addRow([`Rapor Tarihi: ${today.toLocaleDateString('tr-TR')}`, '']);
    metaRow.font = { name: 'Calibri', size: 10, italic: true, color: { argb: '666666' } };
    s1.addRow([]);

    addHeaderRow(s1, ['Metrik', 'Değer'], 4);
    const metrics = [
      ['Toplam Oda', rooms.length],
      ['Boş Oda', rooms.filter((r) => r.occupancyStatus === 'VACANT').length],
      ['Inhouse (İçerideki Müşteri)', rooms.filter((r) => r.occupancyStatus === 'INHOUSE').length],
      ['Arrival (Giriş Yapacak)', rooms.filter((r) => r.occupancyStatus === 'ARRIVAL').length],
      ['Departure (Çıkış Yapacak)', rooms.filter((r) => r.occupancyStatus === 'DEPARTURE').length],
      ['DND (Rahatsız Etmeyin)', rooms.filter((r) => r.minibarStatus === 'DND').length],
      ['Tamamlandı', rooms.filter((r) => r.minibarStatus === 'COMPLETED').length],
      ['Bekleyen', rooms.filter((r) => r.minibarStatus === 'PENDING').length],
      ['Sonra', rooms.filter((r) => r.minibarStatus === 'LATER').length],
      ['Bugünkü Tüketim Sayısı', logs.length],
    ];
    metrics.forEach((m, i) => addDataRow(s1, 5 + i, m, i % 2 === 1));
    s1.columns = [
      { key: 'metric', width: 35 },
      { key: 'value', width: 20 },
    ] as any;

    /* ---- Sheet 2: Tüketim Detayları ---- */
    const s2 = workbook.addWorksheet('Tüketim Detayları');
    (s2 as any).properties.tabColor = { argb: '0F9D58' };

    addTitleRow(s2, 'TÜKETİM DETAYLARI', 9);
    s2.addRow([`Tarih: ${today.toLocaleDateString('tr-TR')}`, '', '', '', '', '', '', '', '']);
    s2.addRow([]);

    addHeaderRow(s2, ['Saat', 'Blok', 'Kat', 'Oda', 'Personel', 'Ürün', 'Adet', 'Birim Fiyat', 'Tutar (TL)'], 4);
    logs.forEach((log, i) => {
      addDataRow(s2, 5 + i, [
        new Date(log.performedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        log.room.block.name,
        log.room.floor.name,
        log.room.name,
        `${log.personnel.firstName} ${log.personnel.lastName}`,
        log.product.name,
        log.quantity,
        Number(log.product.price).toFixed(2),
        (log.quantity * Number(log.product.price)).toFixed(2),
      ], i % 2 === 1);
    });

    if (logs.length > 0) {
      const totalRow = 5 + logs.length;
      s2.getCell(`A${totalRow}`).value = 'TOPLAM';
      s2.getCell(`A${totalRow}`).font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND_DARK } };
      s2.getCell(`G${totalRow}`).value = logs.reduce((s, l) => s + l.quantity, 0);
      s2.getCell(`G${totalRow}`).font = { name: 'Calibri', size: 11, bold: true };
      s2.getCell(`G${totalRow}`).alignment = { horizontal: 'right' };
      s2.getCell(`I${totalRow}`).value = { formula: `SUM(I5:I${totalRow - 1})` };
      s2.getCell(`I${totalRow}`).font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND_PRIMARY } };
      s2.getCell(`I${totalRow}`).alignment = { horizontal: 'right' };
      s2.getCell(`I${totalRow}`).numFmt = '#,##0.00';
      for (let c = 1; c <= 9; c++) {
        const cell = s2.getCell(totalRow, c);
        cell.border = {
          top: { style: 'double', color: { argb: BRAND_PRIMARY } },
          bottom: { style: 'double', color: { argb: BRAND_PRIMARY } },
          left: { style: 'thin', color: { argb: BORDER_COLOR } },
          right: { style: 'thin', color: { argb: BORDER_COLOR } },
        };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F0FE' } };
      }
    }

    s2.columns = [
      { key: 'time', width: 10 }, { key: 'block', width: 12 }, { key: 'floor', width: 10 },
      { key: 'room', width: 12 }, { key: 'personnel', width: 20 }, { key: 'product', width: 22 },
      { key: 'qty', width: 8 }, { key: 'price', width: 14 }, { key: 'total', width: 14 },
    ] as any;
    s2.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + logs.length, column: 9 } };

    /* ---- Sheet 3: Ürün Bazlı Tüketim ---- */
    const s3 = workbook.addWorksheet('Ürün Bazlı Tüketim');
    (s3 as any).properties.tabColor = { argb: 'F57F17' };

    addTitleRow(s3, 'ÜRÜN BAZLI TÜKETİM RAPORU', 6);
    s3.addRow([]);

    const productSummary: Record<string, { total: number; price: number; revenue: number }> = {};
    logs.forEach((log) => {
      const name = log.product.name;
      if (!productSummary[name]) {
        productSummary[name] = { total: 0, price: Number(log.product.price), revenue: 0 };
      }
      productSummary[name].total += log.quantity;
      productSummary[name].revenue += log.quantity * Number(log.product.price);
    });

    addHeaderRow(s3, ['#', 'Ürün Adı', 'Birim Fiyat (TL)', 'Satılan Adet', 'Toplam Tutar (TL)', 'Ciro Payı (%)'], 3);
    const sortedProducts = Object.entries(productSummary).sort((a, b) => b[1].revenue - a[1].revenue);
    const totalRevenue = sortedProducts.reduce((s, [, d]) => s + d.revenue, 0);
    sortedProducts.forEach(([name, data], i) => {
      const pct = totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(1) : '0.0';
      addDataRow(s3, 4 + i, [i + 1, name, data.price.toFixed(2), data.total, data.revenue.toFixed(2), `${pct}%`], i % 2 === 1);
    });

    if (sortedProducts.length > 0) {
      const totalRow = 4 + sortedProducts.length;
      s3.getCell(`A${totalRow}`).value = '';
      s3.getCell(`B${totalRow}`).value = 'GENEL TOPLAM';
      s3.getCell(`B${totalRow}`).font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND_DARK } };
      s3.getCell(`D${totalRow}`).value = { formula: `SUM(D4:D${totalRow - 1})` };
      s3.getCell(`D${totalRow}`).font = { name: 'Calibri', size: 11, bold: true };
      s3.getCell(`D${totalRow}`).alignment = { horizontal: 'right' };
      s3.getCell(`E${totalRow}`).value = { formula: `SUM(E4:E${totalRow - 1})` };
      s3.getCell(`E${totalRow}`).font = { name: 'Calibri', size: 11, bold: true, color: { argb: BRAND_PRIMARY } };
      s3.getCell(`E${totalRow}`).alignment = { horizontal: 'right' };
      s3.getCell(`E${totalRow}`).numFmt = '#,##0.00';
      for (let c = 1; c <= 6; c++) {
        const cell = s3.getCell(totalRow, c);
        cell.border = {
          top: { style: 'double', color: { argb: BRAND_PRIMARY } },
          bottom: { style: 'double', color: { argb: BRAND_PRIMARY } },
          left: { style: 'thin', color: { argb: BORDER_COLOR } },
          right: { style: 'thin', color: { argb: BORDER_COLOR } },
        };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F0FE' } };
      }
    }

    s3.columns = [
      { key: 'no', width: 5 }, { key: 'product', width: 28 }, { key: 'price', width: 18 },
      { key: 'qty', width: 15 }, { key: 'revenue', width: 20 }, { key: 'share', width: 15 },
    ] as any;

    /* ---- Sheet 4: Oda Durumları ---- */
    const s4 = workbook.addWorksheet('Oda Durumları');
    (s4 as any).properties.tabColor = { argb: '6A1B9A' };

    addTitleRow(s4, 'ODA DURUMLARI RAPORU', 6);
    s4.addRow([]);

    addHeaderRow(s4, ['Blok', 'Kat', 'Oda', 'Konaklama Durumu', 'Minibar Durumu', 'Not'], 3);
    rooms.forEach((room, i) => {
      addDataRow(s4, 4 + i, [
        room.block.name,
        room.floor.name,
        room.name,
        this.translateOccupancy(room.occupancyStatus),
        this.translateMinibarStatus(room.minibarStatus),
        room.note || '-',
      ], i % 2 === 1);
    });

    s4.columns = [
      { key: 'block', width: 12 }, { key: 'floor', width: 10 }, { key: 'room', width: 12 },
      { key: 'occupancy', width: 28 }, { key: 'minibar', width: 22 }, { key: 'note', width: 32 },
    ] as any;
    s4.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3 + rooms.length, column: 6 } };

    /* ---- Footer ---- */
    const footerText = `Rapor oluşturulma: ${new Date().toLocaleString('tr-TR')} — Hotel Minibar Yönetim Sistemi`;
    const writeFooter = (ws: ExcelJS.Worksheet, lastRow: number) => {
      const row = ws.addRow([footerText]);
      row.font = { name: 'Calibri', size: 8, italic: true, color: { argb: '999999' } };
      ws.mergeCells(lastRow + 1, 1, lastRow + 1, 9);
    };
    writeFooter(s1, 5 + metrics.length);
    writeFooter(s2, 5 + logs.length + 1);
    writeFooter(s3, 4 + sortedProducts.length + 1);
    writeFooter(s4, 4 + rooms.length);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=minibar-raporu-${new Date().toISOString().split('T')[0]}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  }

  async generatePDFReport(res: Response, blockId?: string, floorId?: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const roomWhere: any = {};
    if (blockId) roomWhere.blockId = blockId;
    if (floorId) roomWhere.floorId = floorId;

    const rooms = await this.prisma.room.findMany({
      where: roomWhere,
      include: { block: true, floor: true },
      orderBy: [{ block: { name: 'asc' } }, { name: 'asc' }],
    });

    const roomIds = rooms.map((r) => r.id);
    const logWhere: any = { performedAt: { gte: today } };
    if (roomIds.length > 0) logWhere.roomId = { in: roomIds };

    const logs = await this.prisma.minibarLog.findMany({
      where: logWhere,
      include: {
        room: { include: { block: true, floor: true } },
        product: true,
        personnel: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ performedAt: 'desc' }],
    });

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: {
        Title: 'Minibar Gün Sonu Raporu',
        Author: 'Hotel Minibar Yönetim Sistemi',
        Subject: 'Gün Sonu Raporu',
        Producer: 'Hotel Minibar',
        Creator: 'Hotel Minibar Yönetim Sistemi',
      },
    });

    const fontRegular = path.join(FONT_DIR, 'arial.ttf');
    const fontBold = path.join(FONT_DIR, 'arialbd.ttf');
    const fontItalic = path.join(FONT_DIR, 'ariali.ttf');

    doc.registerFont('Arial', fontRegular);
    doc.registerFont('Arial-Bold', fontBold);
    doc.registerFont('Arial-Italic', fontItalic);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=minibar-raporu-${new Date().toISOString().split('T')[0]}.pdf`);
    doc.pipe(res);

    /* ---- Header every page ---- */
    const addHeader = () => {
      if (doc.y > 700) {
        doc.addPage();
      }
    };

    /* ---- Footer with page number ---- */

    /* ---- Cover Section ---- */
    doc.fontSize(26).font('Arial-Bold').fillColor('#1a1f36').text('HOTEL MİNİBAR', { align: 'center' });
    doc.fontSize(20).font('Arial-Bold').fillColor('#1a73e8').text('YÖNETİM SİSTEMİ', { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(18).font('Arial').fillColor('#333333').text('Gün Sonu Raporu', { align: 'center' });
    doc.fontSize(12).font('Arial').fillColor('#666666').text(today.toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), { align: 'center' });
    if (blockId || floorId) {
      doc.fontSize(10).font('Arial-Italic').fillColor('#999999').text('(Filtreli Rapor)', { align: 'center' });
    }
    doc.moveDown(1);

    /* Separator line */
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1a73e8').lineWidth(2).stroke();
    doc.moveDown(1.5);

    /* ---- Section 1: Özet İstatistikler ---- */
    doc.fontSize(16).font('Arial-Bold').fillColor('#1a1f36').text('1. ÖZET İSTATİSTİKLER');
    doc.moveDown(0.3);

    const totalRevenue = logs.reduce((sum, l) => sum + l.quantity * Number(l.product.price), 0);
    const statsData = [
      ['Toplam Oda', rooms.length],
      ['Boş Oda', rooms.filter((r) => r.occupancyStatus === 'VACANT').length],
      ['Inhouse (İçerideki Müşteri)', rooms.filter((r) => r.occupancyStatus === 'INHOUSE').length],
      ['Arrival (Giriş Yapacak)', rooms.filter((r) => r.occupancyStatus === 'ARRIVAL').length],
      ['Departure (Çıkış Yapacak)', rooms.filter((r) => r.occupancyStatus === 'DEPARTURE').length],
      ['DND (Rahatsız Etmeyin)', rooms.filter((r) => r.minibarStatus === 'DND').length],
      ['Tamamlanan Oda', rooms.filter((r) => r.minibarStatus === 'COMPLETED').length],
      ['Bekleyen Oda', rooms.filter((r) => r.minibarStatus === 'PENDING').length],
      ['Sonra', rooms.filter((r) => r.minibarStatus === 'LATER').length],
      ['Toplam Tüketim Adedi', logs.length],
    ];

    const startY = doc.y;
    const col1X = 60;
    const col2X = 320;
    statsData.forEach(([label, value], i) => {
      const y = startY + i * 18;
      doc.fontSize(10).font('Arial').fillColor('#444444').text(label as string, col1X, y, { width: 200 });
      doc.fontSize(10).font('Arial-Bold').fillColor('#1a1f36').text(String(value), col2X, y, { width: 80, align: 'right' });
      if (i === statsData.length - 1) {
        doc.moveTo(col1X - 5, y + 18).lineTo(col2X + 80, y + 18).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
      }
    });
    doc.y = startY + statsData.length * 18 + 8;

    doc.fontSize(11).font('Arial-Bold').fillColor('#1a73e8').text(`Toplam Ciro: ${totalRevenue.toFixed(2)} TL`, { align: 'right' });
    doc.moveDown(1.5);

    /* ---- Section 2: Ürün Bazlı Tüketim ---- */
    doc.fontSize(16).font('Arial-Bold').fillColor('#1a1f36').text('2. ÜRÜN BAZLI TÜKETİM');
    doc.moveDown(0.3);

    const productSummary: Record<string, { total: number; revenue: number }> = {};
    logs.forEach((log) => {
      const name = log.product.name;
      if (!productSummary[name]) productSummary[name] = { total: 0, revenue: 0 };
      productSummary[name].total += log.quantity;
      productSummary[name].revenue += log.quantity * Number(log.product.price);
    });

    const sortedProducts = Object.entries(productSummary).sort((a, b) => b[1].revenue - a[1].revenue);

    /* Product table header */
    const tableTop = doc.y;
    const tableHeaders = ['Ürün', 'Adet', 'Birim Fiyat', 'Toplam'];
    const colWidths = [200, 80, 100, 100];
    const colPositions = [60, 260, 345, 450];
    doc.rect(55, tableTop - 4, 495, 20).fillColor('#1a73e8').fill();
    doc.fontSize(9).font('Arial-Bold').fillColor('#FFFFFF');
    tableHeaders.forEach((h, i) => doc.text(h, colPositions[i], tableTop, { width: colWidths[i], align: i === 0 ? 'left' : 'right' }));
    doc.y = tableTop + 22;

    sortedProducts.forEach(([name, data], i) => {
      addHeader();
      const rowY = doc.y;
      if (i % 2 === 0) {
        doc.rect(55, rowY - 4, 495, 18).fillColor('#f8f9fa').fill();
      }
      doc.fontSize(9).font('Arial').fillColor('#333333');
      doc.text(name, 60, rowY, { width: 200, align: 'left' });
      doc.text(String(data.total), 260, rowY, { width: 80, align: 'right' });
      doc.text(`${(data.revenue / data.total).toFixed(2)} TL`, 345, rowY, { width: 100, align: 'right' });
      doc.text(`${data.revenue.toFixed(2)} TL`, 450, rowY, { width: 100, align: 'right' });
      doc.y = rowY + 18;
      doc.moveTo(55, doc.y - 2).lineTo(550, doc.y - 2).strokeColor('#eeeeee').lineWidth(0.5).stroke();
    });

    /* Total row */
    const totalRowY = doc.y + 4;
    doc.rect(55, totalRowY - 4, 495, 20).fillColor('#e8f0fe').fill();
    doc.fontSize(10).font('Arial-Bold').fillColor('#1a1f36');
    doc.text('GENEL TOPLAM', 60, totalRowY, { width: 200 });
    doc.text(String(logs.reduce((s, l) => s + l.quantity, 0)), 260, totalRowY, { width: 80, align: 'right' });
    doc.text('', 345, totalRowY, { width: 100, align: 'right' });
    doc.text(`${totalRevenue.toFixed(2)} TL`, 450, totalRowY, { width: 100, align: 'right' });
    doc.y = totalRowY + 24;

    /* ---- Section 3: Bugünkü İşlemler ---- */
    if (logs.length > 0) {
      doc.addPage();
      doc.fontSize(16).font('Arial-Bold').fillColor('#1a1f36').text('3. BUGÜNKÜ İŞLEMLER');
      doc.moveDown(0.3);

      const logTableTop = doc.y;
      const logHeaders = ['Saat', 'Blok', 'Oda', 'Personel', 'Ürün', 'Tutar'];
      const logColW = [50, 60, 60, 100, 140, 70];
      const logColPos = [55, 108, 170, 232, 335, 475];
      doc.rect(50, logTableTop - 4, 495, 20).fillColor('#1a73e8').fill();
      doc.fontSize(8).font('Arial-Bold').fillColor('#FFFFFF');
      logHeaders.forEach((h, i) => doc.text(h, logColPos[i], logTableTop, { width: logColW[i], align: i < 2 ? 'left' : (i === 5 ? 'right' : 'left') }));
      doc.y = logTableTop + 22;

      logs.slice(0, 60).forEach((log, i) => {
        const rowY = doc.y;
        if (rowY > 740) {
          doc.addPage();
          const newTop = doc.y;
          doc.rect(50, newTop - 4, 495, 20).fillColor('#1a73e8').fill();
          doc.fontSize(8).font('Arial-Bold').fillColor('#FFFFFF');
          logHeaders.forEach((h, j) => doc.text(h, logColPos[j], newTop, { width: logColW[j], align: j < 2 ? 'left' : (j === 5 ? 'right' : 'left') }));
          doc.y = newTop + 22;
        }
        if (i % 2 === 0) {
          doc.rect(50, rowY - 3, 495, 16).fillColor('#f8f9fa').fill();
        }
        const rev = (log.quantity * Number(log.product.price)).toFixed(2);
        doc.fontSize(7.5).font('Arial').fillColor('#333333');
        doc.text(new Date(log.performedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), logColPos[0], rowY, { width: logColW[0] });
        doc.text(log.room.block.name, logColPos[1], rowY, { width: logColW[1] });
        doc.text(log.room.name, logColPos[2], rowY, { width: logColW[2] });
        doc.text(`${log.personnel.firstName} ${log.personnel.lastName}`, logColPos[3], rowY, { width: logColW[3] });
        doc.text(log.product.name, logColPos[4], rowY, { width: logColW[4] });
        doc.text(`${rev} TL`, logColPos[5], rowY, { width: logColW[5], align: 'right' });
        doc.y = rowY + 16;
      });
    }

    /* ---- Footer on last page ---- */
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1a73e8').lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).font('Arial-Italic').fillColor('#999999').text(
      `Rapor oluşturulma: ${new Date().toLocaleString('tr-TR')} | Hotel Minibar Yönetim Sistemi v1.0`,
      { align: 'center' }
    );

    /* ---- Page numbers ---- */
    try {
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).font('Arial').fillColor('#999999');
        doc.text(`Sayfa ${i + 1} / ${range.count}`, 500, 780, { align: 'right', width: 60 });
        doc.text(new Date().toLocaleDateString('tr-TR'), 55, 780, { width: 100 });
      }
    } catch { /* page numbers are non-critical */ }

    doc.end();
  }

  async getPerformanceStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const personnel = await this.prisma.user.findMany({
      where: { role: 'PERSONNEL', isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        minibarLogs: {
          include: { product: true },
          orderBy: { performedAt: 'desc' },
        },
        statusChanges: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const todayLogs = await this.prisma.minibarLog.findMany({
      where: { performedAt: { gte: today } },
      include: { product: true, personnel: { select: { firstName: true, lastName: true } } },
    });

    const totalRevenue = todayLogs.reduce((sum, l) => sum + l.quantity * Number(l.product.price), 0);

    return personnel.map((p) => {
      const todayActions = p.minibarLogs.filter((l) => l.performedAt >= today).length;
      const totalRevenueByUser = p.minibarLogs.reduce((sum, l) => sum + l.quantity * Number(l.product.price), 0);
      const completedRooms = new Set(p.statusChanges.filter((s) => s.newStatus === 'COMPLETED').map((s) => s.roomId)).size;
      return {
        id: p.id,
        name: `${p.firstName} ${p.lastName}`,
        totalActions: p.minibarLogs.length,
        todayActions,
        totalRevenue: Math.round(totalRevenueByUser * 100) / 100,
        completedRooms,
        lastAction: p.minibarLogs[0]?.performedAt || null,
      };
    });
  }

  async getProductRevenueReport(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.performedAt = {};
      if (startDate) where.performedAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.performedAt.lte = end;
      }
    }
    const logs = await this.prisma.minibarLog.findMany({
      where,
      include: { product: true, room: { include: { block: true, floor: true } }, personnel: { select: { firstName: true, lastName: true } } },
    });
    const productMap: Record<string, { productName: string; totalQuantity: number; totalRevenue: number; unitPrice: number; transactionCount: number }> = {};
    logs.forEach((log) => {
      const id = log.productId;
      if (!productMap[id]) {
        productMap[id] = { productName: log.product.name, totalQuantity: 0, totalRevenue: 0, unitPrice: Number(log.product.price), transactionCount: 0 };
      }
      productMap[id].totalQuantity += log.quantity;
      productMap[id].totalRevenue += log.quantity * Number(log.product.price);
      productMap[id].transactionCount += 1;
    });
    const products = Object.values(productMap).sort((a, b) => b.totalRevenue - a.totalRevenue);
    const totalRevenue = products.reduce((s, p) => s + p.totalRevenue, 0);
    const totalQuantity = products.reduce((s, p) => s + p.totalQuantity, 0);
    return { products, totalRevenue: Math.round(totalRevenue * 100) / 100, totalQuantity, dateRange: { start: startDate || null, end: endDate || null } };
  }

  async getRoomConsumptionHeatmap(blockId?: string, floorId?: string) {
    const roomWhere: any = {};
    if (blockId) roomWhere.blockId = blockId;
    if (floorId) roomWhere.floorId = floorId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rooms = await this.prisma.room.findMany({
      where: roomWhere,
      include: {
        block: true,
        floor: true,
        minibarLogs: { where: { performedAt: { gte: today } }, include: { product: true } },
      },
    });
    const heatmap = rooms.map((room) => {
      const totalConsumption = room.minibarLogs.reduce((s, l) => s + l.quantity, 0);
      const totalRevenue = room.minibarLogs.reduce((s, l) => s + l.quantity * Number(l.product.price), 0);
      return {
        roomId: room.id,
        roomName: room.name,
        blockName: room.block.name,
        floorName: room.floor.name,
        occupancyStatus: room.occupancyStatus,
        minibarStatus: room.minibarStatus,
        totalConsumption,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        transactionCount: room.minibarLogs.length,
      };
    });
    const maxConsumption = heatmap.length > 0 ? Math.max(...heatmap.map((r) => r.totalConsumption)) : 1;
    const maxRevenue = heatmap.length > 0 ? Math.max(...heatmap.map((r) => r.totalRevenue)) : 1;
    return { heatmap, maxConsumption, maxRevenue };
  }

  async getRoomConsumptionReport(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate || endDate) {
      where.performedAt = {};
      if (startDate) where.performedAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.performedAt.lte = end;
      }
    }
    const logs = await this.prisma.minibarLog.findMany({
      where,
      include: {
        room: { include: { block: true, floor: true } },
        product: true,
        personnel: { select: { firstName: true, lastName: true } },
      },
      orderBy: [{ room: { block: { name: 'asc' } } }, { room: { name: 'asc' } }, { performedAt: 'desc' }],
    });

    const roomMap: Record<string, {
      roomId: string;
      roomName: string;
      blockName: string;
      floorName: string;
      occupancyStatus: string;
      minibarStatus: string;
      products: { name: string; quantity: number; revenue: number }[];
      totalQuantity: number;
      totalRevenue: number;
    }> = {};

    logs.forEach((log) => {
      const key = log.roomId;
      if (!roomMap[key]) {
        roomMap[key] = {
          roomId: log.roomId,
          roomName: log.room.name,
          blockName: log.room.block.name,
          floorName: log.room.floor.name,
          occupancyStatus: log.room.occupancyStatus,
          minibarStatus: log.room.minibarStatus,
          products: [],
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }
      const entry = roomMap[key];
      const existing = entry.products.find((p) => p.name === log.product.name);
      if (existing) {
        existing.quantity += log.quantity;
        existing.revenue += log.quantity * Number(log.product.price);
      } else {
        entry.products.push({
          name: log.product.name,
          quantity: log.quantity,
          revenue: log.quantity * Number(log.product.price),
        });
      }
      entry.totalQuantity += log.quantity;
      entry.totalRevenue += log.quantity * Number(log.product.price);
    });

    const rooms = Object.values(roomMap);
    const grandTotal = rooms.reduce((s, r) => s + r.totalRevenue, 0);
    return { rooms, grandTotal: Math.round(grandTotal * 100) / 100, dateRange: { start: startDate || null, end: endDate || null } };
  }

  async generateSnapshotPDF(res: Response, snapshot: any): Promise<void> {
    const data = snapshot.data;
    const rooms = data.rooms || [];

    const doc = new PDFDocument({
      margin: 50, size: 'A4',
      info: {
        Title: snapshot.label, Author: 'Hotel Minibar Yönetim Sistemi',
        Subject: 'Gün Sonu Raporu', Producer: 'Hotel Minibar',
        Creator: 'Hotel Minibar Yönetim Sistemi',
      },
    });

    const fontRegular = path.join(FONT_DIR, 'arial.ttf');
    const fontBold = path.join(FONT_DIR, 'arialbd.ttf');
    const fontItalic = path.join(FONT_DIR, 'ariali.ttf');
    doc.registerFont('Arial', fontRegular);
    doc.registerFont('Arial-Bold', fontBold);
    doc.registerFont('Arial-Italic', fontItalic);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=snapshot-${snapshot.id}.pdf`);
    doc.pipe(res);

    doc.fontSize(26).font('Arial-Bold').fillColor('#1a1f36').text('HOTEL MİNİBAR', { align: 'center' });
    doc.fontSize(20).font('Arial-Bold').fillColor('#1a73e8').text('YÖNETİM SİSTEMİ', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).font('Arial').fillColor('#333333').text(snapshot.label, { align: 'center' });
    doc.fontSize(11).font('Arial').fillColor('#666666').text(new Date(data.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1a73e8').lineWidth(2).stroke();
    doc.moveDown(1.5);

    /* Stats */
    doc.fontSize(14).font('Arial-Bold').fillColor('#1a1f36').text('ÖZET');
    doc.moveDown(0.3);
    const stats = [
      ['Toplam Oda', rooms.length],
      ['Toplam Tüketim Adedi', data.totalQuantity],
    ];
    stats.forEach(([label, value]) => {
      doc.fontSize(10).font('Arial').fillColor('#444444').text(`${label}: ${value}`, { continued: false });
    });
    doc.fontSize(12).font('Arial-Bold').fillColor('#1a73e8').text(`Toplam Ciro: ${data.totalRevenue?.toFixed(2) || '0'} TL`, { align: 'right' });
    doc.moveDown(1.5);

    /* Room table */
    doc.fontSize(14).font('Arial-Bold').fillColor('#1a1f36').text('ODA BAZLI TÜKETİM');
    doc.moveDown(0.3);

    let y = doc.y;
    const pageW = 495;
    const cols = [
      { label: 'Oda', x: 55, w: 60 },
      { label: 'Blok', x: 115, w: 50 },
      { label: 'Kat', x: 165, w: 45 },
      { label: 'Ürünler', x: 210, w: 200 },
      { label: 'Adet', x: 410, w: 45 },
      { label: 'Tutar', x: 455, w: 80 },
    ];

    const drawHeader = (yp: number) => {
      doc.rect(50, yp - 4, pageW + 5, 20).fillColor('#1a73e8').fill();
      doc.fontSize(8).font('Arial-Bold').fillColor('#FFFFFF');
      cols.forEach((c) => doc.text(c.label, c.x, yp, { width: c.w, align: c.label === 'Adet' || c.label === 'Tutar' ? 'right' : 'left' }));
    };

    drawHeader(y);
    y += 22;

    rooms.forEach((room: any, i: number) => {
      if (y > 740) {
        doc.addPage();
        y = doc.y;
        drawHeader(y);
        y += 22;
      }
      if (i % 2 === 0) doc.rect(50, y - 3, pageW + 5, 18).fillColor('#f8f9fa').fill();
      const productStr = (room.products || []).map((p: any) => `${p.name}: ${p.quantity}`).join(', ');
      doc.fontSize(7.5).font('Arial').fillColor('#333333');
      doc.text(room.name, 55, y, { width: 60 });
      doc.text(room.blockName || '', 115, y, { width: 50 });
      doc.text(room.floorName || '', 165, y, { width: 45 });
      doc.text(productStr || '-', 210, y, { width: 200 });
      doc.text(String(room.totalQuantity || 0), 410, y, { width: 45, align: 'right' });
      doc.text(`${(room.totalRevenue || 0).toFixed(2)} TL`, 455, y, { width: 80, align: 'right' });
      y += 18;
    });

    /* Total */
    doc.rect(50, y - 2, pageW + 5, 20).fillColor('#e8f0fe').fill();
    doc.fontSize(9).font('Arial-Bold').fillColor('#1a1f36');
    doc.text('GENEL TOPLAM', 55, y, { width: 155 });
    doc.text(String(data.totalQuantity || 0), 410, y, { width: 45, align: 'right' });
    doc.text(`${(data.totalRevenue || 0).toFixed(2)} TL`, 455, y, { width: 80, align: 'right' });
    y += 24;

    /* Footer */
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#1a73e8').lineWidth(1).stroke();
    y += 16;
    doc.fontSize(8).font('Arial-Italic').fillColor('#999999').text(
      `Rapor oluşturulma: ${new Date().toLocaleString('tr-TR')} | Hotel Minibar Yönetim Sistemi`, { align: 'center' }
    );

    try {
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).font('Arial').fillColor('#999999');
        doc.text(`Sayfa ${i + 1} / ${range.count}`, 500, 780, { align: 'right', width: 60 });
        doc.text(new Date().toLocaleDateString('tr-TR'), 55, 780, { width: 100 });
      }
    } catch { /* non-critical */ }

    doc.end();
  }

  async generateRoomConsumptionPDF(res: Response, startDate?: string, endDate?: string): Promise<void> {
    const rooms = (await this.getRoomConsumptionReport(startDate, endDate)).rooms;

    const doc = new PDFDocument({
      margin: 50, size: 'A4',
      info: {
        Title: 'Oda Bazlı Tüketim Raporu', Author: 'Hotel Minibar Yönetim Sistemi',
        Subject: 'Oda Tüketim Raporu', Producer: 'Hotel Minibar',
        Creator: 'Hotel Minibar Yönetim Sistemi',
      },
    });

    const fontRegular = path.join(FONT_DIR, 'arial.ttf');
    const fontBold = path.join(FONT_DIR, 'arialbd.ttf');
    const fontItalic = path.join(FONT_DIR, 'ariali.ttf');
    doc.registerFont('Arial', fontRegular);
    doc.registerFont('Arial-Bold', fontBold);
    doc.registerFont('Arial-Italic', fontItalic);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=oda-tuketim-raporu-${new Date().toISOString().split('T')[0]}.pdf`);
    doc.pipe(res);

    /* Cover */
    doc.fontSize(26).font('Arial-Bold').fillColor('#1a1f36').text('HOTEL MİNİBAR', { align: 'center' });
    doc.fontSize(20).font('Arial-Bold').fillColor('#1a73e8').text('YÖNETİM SİSTEMİ', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).font('Arial').fillColor('#333333').text('Oda Bazlı Tüketim Raporu', { align: 'center' });
    const dateLabel = startDate || endDate ? `${startDate || '...'} — ${endDate || '...'}` : 'Tüm Zamanlar';
    doc.fontSize(11).font('Arial').fillColor('#666666').text(dateLabel, { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1a73e8').lineWidth(2).stroke();
    doc.moveDown(1.5);

    /* Table header */
    const pageW = 495;
    const cols = [
      { label: 'Oda', x: 55, w: 65 },
      { label: 'Blok', x: 120, w: 55 },
      { label: 'Kat', x: 175, w: 50 },
      { label: 'Ürünler (Adet)', x: 225, w: 190 },
      { label: 'Toplam Adet', x: 415, w: 60 },
      { label: 'Toplam Tutar', x: 475, w: 70 },
    ];

    const drawTableHeader = (yPos: number) => {
      doc.rect(50, yPos - 4, pageW + 5, 20).fillColor('#1a73e8').fill();
      doc.fontSize(8).font('Arial-Bold').fillColor('#FFFFFF');
      cols.forEach((c) => doc.text(c.label, c.x, yPos, { width: c.w, align: c.label === 'Toplam Adet' || c.label === 'Toplam Tutar' ? 'right' : 'left' }));
    };

    let y = doc.y;
    drawTableHeader(y);
    y += 22;

    rooms.forEach((room: any, i: number) => {
      if (y > 740) {
        doc.addPage();
        y = doc.y;
        drawTableHeader(y);
        y += 22;
      }
      if (i % 2 === 0) doc.rect(50, y - 3, pageW + 5, room.products.length > 3 ? 38 : 18).fillColor('#f8f9fa').fill();
      const productStr = room.products.map((p: any) => `${p.name}: ${p.quantity}`).join(', ');
      doc.fontSize(7.5).font('Arial').fillColor('#333333');
      const rowH = productStr.length > 50 ? 36 : 16;
      doc.text(room.roomName, 55, y, { width: 65 });
      doc.text(room.blockName, 120, y, { width: 55 });
      doc.text(room.floorName, 175, y, { width: 50 });
      doc.text(productStr, 225, y, { width: 190 });
      doc.text(String(room.totalQuantity), 415, y, { width: 60, align: 'right' });
      doc.text(`${room.totalRevenue.toFixed(2)} TL`, 475, y, { width: 70, align: 'right' });
      y += rowH;
    });

    /* Total row */
    const grandTotal = rooms.reduce((s: number, r: any) => s + r.totalRevenue, 0);
    const grandQty = rooms.reduce((s: number, r: any) => s + r.totalQuantity, 0);
    doc.rect(50, y - 2, pageW + 5, 20).fillColor('#e8f0fe').fill();
    doc.fontSize(9).font('Arial-Bold').fillColor('#1a1f36');
    doc.text('GENEL TOPLAM', 55, y, { width: 170 });
    doc.text(String(grandQty), 415, y, { width: 60, align: 'right' });
    doc.text(`${grandTotal.toFixed(2)} TL`, 475, y, { width: 70, align: 'right' });
    y += 24;

    /* Footer */
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#1a73e8').lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).font('Arial-Italic').fillColor('#999999').text(
      `Rapor oluşturulma: ${new Date().toLocaleString('tr-TR')} | Hotel Minibar Yönetim Sistemi v1.0`, { align: 'center' }
    );

    /* Page numbers */
    try {
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).font('Arial').fillColor('#999999');
        doc.text(`Sayfa ${i + 1} / ${range.count}`, 500, 780, { align: 'right', width: 60 });
        doc.text(new Date().toLocaleDateString('tr-TR'), 55, 780, { width: 100 });
      }
    } catch { /* non-critical */ }

    doc.end();
  }

  private translateOccupancy(status: string): string {
    const map: Record<string, string> = {
      VACANT: 'Boş Oda',
      INHOUSE: 'İçerideki Müşteri',
      ARRIVAL: 'Giriş Yapacak',
      DEPARTURE: 'Çıkış Yapacak',
      DEPARTURE_ARRIVAL: 'Çıkış + Giriş',
    };
    return map[status] || status;
  }

  private translateMinibarStatus(status: string): string {
    const map: Record<string, string> = {
      DND: 'Rahatsız Etmeyin',
      LATER: 'Sonra',
      COMPLETED: 'Tamamlandı',
      PENDING: 'Beklemede',
    };
    return map[status] || status;
  }
}