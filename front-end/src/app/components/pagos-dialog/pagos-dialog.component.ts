import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector   : 'app-pagos-dialog',
  standalone : false,
  templateUrl: './pagos-dialog.component.html',
  styleUrls  : ['./pagos-dialog.component.css']
})
export class PagosDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<PagosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      pagos : { cliente:string; fecha:string; reserva:string; monto:number }[],
      total : number,
      desde : Date,
      hasta : Date
    }
  ) {}

  cerrar(): void { this.dialogRef.close(); }

  /* ---------- exportar PDF ---------- */
  /* ---------- exportar PDF ---------- */
/* ---------- exportar PDF ---------- */
downloadPdf(): void {

  /* helpers --------------------------------------------------- */
   const fmtFecha = (d: string | Date) =>
        new Date(d).toLocaleDateString('es-EC');

  const fmtMon = (v: number) =>
        new Intl.NumberFormat('es-EC',
             { style:'currency', currency:'USD' }).format(v);

  /* 1) documento --------- */
  const doc       = new jsPDF({ orientation:'portrait', unit:'pt', format:'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  

  /* 2) encabezado corporativo --------------------------------- */
  const headLines = [
    { txt: 'DAAYFOOD S.A.S', size: 16, bold: true },
    { txt: 'Dirección: Dayuma, Vía principal, Calle C N/A y Km 40', size: 11 },
    { txt: 'Orellana-Ecuador', size: 11 },
    { txt: 'Teléfonos: 0992268003 – 0989989254', size: 11 }
  ];
  let y = 40;
  headLines.forEach(l => {
    doc.setFontSize(l.size)
       .setFont('helvetica', l.bold ? 'bold' : 'normal')
       .text(l.txt, pageWidth / 2, y, { align: 'center' });
    y += 16;
  });

  y += 8;
  doc.setFontSize(14).setFont('helvetica','bold')
     .text('Pagos Recibidos', pageWidth / 2, y, { align:'center' });

  y += 18;
  doc.setFontSize(11).setFont('helvetica','bold')
     .text(`Del ${fmtFecha(this.data.desde)} al ${fmtFecha(this.data.hasta)}`,
           pageWidth / 2, y, { align:'center' });

  /* 3) tabla --------------------------------------------------- */
  const marginLR = 40;                      // MARGEN IZQ / DCH
  autoTable(doc, {
    head        : [['Cliente','Fecha','Reserva','Monto']],
    body        : this.data.pagos.map(p => [
                   p.cliente, fmtFecha(p.fecha), p.reserva, fmtMon(p.monto)
                 ]),
    startY      : y + 20,
    margin      : { left: marginLR, right: marginLR },
    theme       : 'grid',
    headStyles  : { fillColor:[63,81,181], textColor:255,
                    halign:'center', fontStyle:'bold' },
    bodyStyles  : { fontSize:10, textColor:60 },
    styles      : { cellPadding:4, overflow:'linebreak' },
    columnStyles: { 3:{ halign:'right' } }
  });

  /* 4) total -------------- */
  const at     = (doc as any).lastAutoTable;     // ← referencia a la tabla
  const rightX = pageWidth - marginLR;           // ← mismo borde derecho
  const finalY = at.finalY + 10;

  doc.setFont('helvetica','bold')
     .text(`TOTAL: ${fmtMon(this.data.total)}`, rightX, finalY,
           { align:'right' });

  /* 5) descargar ---------- */
  doc.save('Pagos.pdf');
}
}
