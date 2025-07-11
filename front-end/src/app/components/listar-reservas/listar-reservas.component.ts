import { Component , OnInit,EventEmitter, Output  } from '@angular/core';
import { ReservasService } from '../../services/reservas.service';
import { ActivatedRoute } from '@angular/router';
import { EstadoReservaService } from '../../services/estado-reserva.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';  
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { GestionProductosComponent } from '../gestion-productos/gestion-productos.component';
import { PageEvent } from '@angular/material/paginator'; 
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { firstValueFrom } from 'rxjs';
import { PagosDialogComponent } from '../pagos-dialog/pagos-dialog.component';

interface PagoFiltrado {
  fecha   : string;
  reserva : string;
  cliente : string;   // ← NUEVO
  monto   : number;
}

@Component({
  selector: 'app-listar-reservas',
  standalone: false,
  
  templateUrl: './listar-reservas.component.html',
  styleUrl: './listar-reservas.component.css'
})
export class ListarReservasComponent implements OnInit {
  reserva: any[] = [];
  resFiltrados: any[] = [];
  searchTerm: string = '';
  estadosReserva: any[] = [];
  highlightedReserva: string | null = null;
  pagedRes: any[] = [];

  displayedReservas: any[] = [];
  pageSize = 5;
  pageIndex = 0;

  showPagosPanel = false;
  dateRange      = { desde: null as Date | null, hasta: null as Date | null };
  pagosFiltrados : PagoFiltrado[] = [];
  totalPagos     = 0;

  /* ------------------------------------------------ */
 

  @Output() cerrar = new EventEmitter<void>();
  volver(){ this.cerrar.emit(); }

  constructor(
    private resService: ReservasService,
    private estadoService: EstadoReservaService,
    private route: ActivatedRoute,
    private router:Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['highlight']) {
        this.highlightedReserva = params['highlight'];
      }
    });

    
    this.cargarReservas();
    this.cargarEstados();

    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTerm = params['search'];
        this.buscarReserva();
        
      }
    });
  }

  cargarReservas(): void {
    this.resService.getAllReservas().subscribe({
      next: data => {
        this.reserva = data;
        this.resFiltrados = data;        // asignas todos a resFiltrados…

        // si venimos con highlight, filtras…
        if (this.highlightedReserva) {
          this.resFiltrados = this.resFiltrados
            .filter(r => r.idreserva === this.highlightedReserva);
          this.router.navigate([], { relativeTo: this.route, queryParams: {} });
        }

        this.pageIndex = 0;                 // resetea a la 1.ª página
    this.updatePagedData();         // ← y aquí arrancas la paginación
      },
      error: err => console.error(err)
    });
  }

  cargarEstados(): void {
    this.estadoService.getEstadoReserva().subscribe({
      next: (data) => {
        this.estadosReserva = data; 
      },
      error: (err) => {
        console.error('Error al obtener estados:', err);
      },
    });
  }

  

  buscarReserva(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.resFiltrados = [...this.reserva];
    } else {
      this.resFiltrados = this.reserva.filter(res =>
        res.cliente.nombre.toLowerCase().includes(term) ||
        res.idreserva.toLowerCase().includes(term) ||
        res.cliente.ci.toLowerCase().includes(term)
      );
    }
    this.pageIndex = 0;                 // resetea a la 1.ª página
    this.updatePagedData();
  }

  pageChanged(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;    // (sigue siendo 10)
    this.updatePagedData();
  }
  
  private updatePagedData(): void {
    const start = this.pageIndex * this.pageSize;
    const end   = start + this.pageSize;
    this.displayedReservas = this.resFiltrados.slice(start, end);
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.highlightedReserva = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.cargarReservas();
  }




  // ============ Al presionar el botón "Guardar" en la fila ============
  guardarEstadoReserva(itemReserva: any) {
    const dataActualizar = {
      idestado: itemReserva.idestado
    };

    this.resService.editarReserva(itemReserva.idreserva, dataActualizar).subscribe({
      next: (resp) => {
        console.log('Estado actualizado correctamente', resp);
        this.cargarReservas();

        const codigocliente = itemReserva.cliente.codigocliente;
      const nombreCliente = itemReserva.cliente.nombre;

      // 2) Determinar el texto según el estado seleccionado (itemReserva.idestado corresponde a un ID numérico,
      //    así que tal vez necesites traducirlo a texto legible; aquí asumimos que en estadosReserva ya tienes
      //    una lista de objetos { idestado, estado_reserva }):
      const estadoObj = this.estadosReserva.find(e => e.idestado === itemReserva.idestado);
      const textoEstado = estadoObj ? estadoObj.estado_reserva : 'Desconocido';

      let mensajeNotificacion = '';
      switch (textoEstado) {
        case 'Aceptada':
          mensajeNotificacion = `Su reserva ${itemReserva.idreserva} ha sido Aceptada. Por favor realice el abono inicial.`;
          break;
        case 'En proceso':
          mensajeNotificacion = `Su reserva ${itemReserva.idreserva} se encuentra En proceso.`;
          break;
        case 'Pagada':
          mensajeNotificacion = `Su reserva ${itemReserva.idreserva} ha sido Pagada. ¡Gracias por preferirnos!`;
          break;
        case 'Cancelada':
          mensajeNotificacion = `Su reserva ${itemReserva.idreserva} ha sido Cancelada.`;
          break;
        default:
          mensajeNotificacion = `Su reserva ${itemReserva.idreserva} cambió a estado "${textoEstado}".`;
      }

      // 3) Leer (o inicializar) el array de notificaciones que guardamos en localStorage para este cliente
      //    Lo almacenaremos en la clave 'notificacionesCliente_<codigocliente>'
      const keyNotifs = `notificacionesCliente_${codigocliente}`;
const actualesJSON = localStorage.getItem(keyNotifs) || '[]';
const actuales = JSON.parse(actualesJSON) as any[];
actuales.push({ texto: mensajeNotificacion, reservaId: itemReserva.idreserva, fecha: new Date().toISOString() });
localStorage.setItem(keyNotifs, JSON.stringify(actuales));
window.dispatchEvent(new CustomEvent('nuevasNotificacionesClienteActualizado'));

      // ————— FIN CÓDIGO NUEVO —————

      Swal.fire({
        icon: 'success',
        title: 'Cambios guardados',
        text: 'Los cambios se han guardado correctamente.',
        confirmButtonText: 'Aceptar'
      });
    },
    error: (err) => {
      console.error('Error al actualizar estado:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo guardar los cambios. Inténtelo nuevamente.',
        confirmButtonText: 'Cerrar'
      });
    }
  });
}
  // ===================== Búsqueda ============================
  
  // (Opcional) Método para eliminar la reserva, si todavía lo necesitas
  eliminarReserva(idreserva: string): void {
    if (confirm('¿Está seguro de que desea eliminar esta reserva?')) {
      this.resService.deleteReserva(idreserva).subscribe({
        next: () => this.cargarReservas(),
        error: (err) => console.error('Error al eliminar reserva:', err),
      });
    }
  }

  verDetalles(idreserva: string) {
    forkJoin({
      reserva: this.resService.getReservaById(idreserva),
      asignados: this.resService.getProductosDeReserva(idreserva)
    }).subscribe({
      next: ({ reserva: resCompleta, asignados }) => {
        // ——— 1) Agrupo duplicados en un Map ———
        const map = new Map<string, { producto: any, cantidad: number }>();
        asignados.forEach(item => {
          const key = item.producto.idproducto;
          if (map.has(key)) {
            map.get(key)!.cantidad += item.cantidad;
          } else {
            map.set(key, { producto: item.producto, cantidad: item.cantidad });
          }
        });
        const agregados = Array.from(map.values());

        // ——— 2) Construyo el HTML ———
        let html = `
          <div style="text-align:left; font-family:Arial,sans-serif;">
          <p><strong>Reserva:</strong> ${resCompleta.idreserva}</p>
            <p><strong>Fecha:</strong> ${resCompleta.fechaevento}</p>
            <p><strong>Dirección:</strong> ${resCompleta.direccionevento}</p>
        `;
        if (resCompleta.nombre?.estado_reserva) {
          html += `
            <p><strong>Estado:</strong>
              <span style="
                background:#d1ecf1; color:#0c5460;
                padding:4px 8px; border-radius:12px;
                font-weight:bold; display:inline-block;">
                ${resCompleta.nombre.estado_reserva}
              </span>
            </p>
          `;
        }
        // tabla de detalles de menú
        html += `
          <table style="width:100%; border-collapse:collapse; margin-top:16px;">
            <thead>
              <tr style="background:#f1f1f1; font-weight:bold;">
                <th style="border:1px solid #ddd; padding:8px;">Menú</th>
                <th style="border:1px solid #ddd; padding:8px;">Precio Unit.</th>
                <th style="border:1px solid #ddd; padding:8px;">Cant.</th>
                <th style="border:1px solid #ddd; padding:8px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
        `;
        resCompleta.detalles.forEach((d: any) => {
          html += `
            <tr>
              <td style="border:1px solid #ddd; padding:8px;">${d.menu?.nombre}</td>
              <td style="border:1px solid #ddd; padding:8px;">${d.preciounitario}</td>
              <td style="border:1px solid #ddd; padding:8px;">${d.cantpersonas}</td>
              <td style="border:1px solid #ddd; padding:8px;">${d.subtotal}</td>
            </tr>
          `;
        });
        html += `
            <tr>
              <td colspan="3" style="border:1px solid #ddd; padding:8px; text-align:right; font-weight:bold;">
                Total:
              </td>
              <td style="border:1px solid #ddd; padding:8px;">
                ${resCompleta.total ?? '0.00'}
              </td>
            </tr>
            </tbody>
          </table>
        `;

        // tabla de productos asignados (agrupados)
        html += `
          <h4 style="margin-top:24px;">Productos asignados</h4>
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr>
                <th style="border:1px solid #ddd; padding:8px;">Producto</th>
                <th style="border:1px solid #ddd; padding:8px;">Cantidad</th>
              </tr>
            </thead>
            <tbody>
        `;
        agregados.forEach(item => {
          html += `
            <tr>
              <td style="border:1px solid #ddd; padding:8px;">${item.producto.nombre}</td>
              <td style="border:1px solid #ddd; padding:8px;">${item.cantidad}</td>
            </tr>
          `;
        });
        html += `</tbody></table></div>`;

        // ——— 3) Muestro SweetAlert2 ———
        Swal.fire({
          title: '',
          html,
          icon: 'info',
          width: 600,
          showDenyButton: true,
          denyButtonText: 'Gestionar',
          confirmButtonText: 'Cerrar'
        })
        .then(res => {
          if (res.isDenied) {
            const ref = this.dialog.open(GestionProductosComponent, {
  width: '800px',
  data: { idreserva }
});

ref.afterClosed().subscribe(saved => {
  if (saved) {
    // el usuario pulsó Guardar → recarga tu lista de reservas
    this.cargarReservas();
  }
});
          }
        });
      },
      error: () => Swal.fire('Error', 'No se pudo cargar la reserva', 'error')
    });
  }

private fmtMoneda = (v: number) =>
  new Intl.NumberFormat('es-EC',
        { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
      .format(v ?? 0);

/* ───── helper fecha corta ───── */
private fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-EC');

/* ================== PDF ================== */
async downloadPdf(filtrarIdEstado?: number): Promise<void> {

  /* 1) Dataset según elección ------------------------------ */
  let dataSource = [...this.resFiltrados];            // listado visible
  if (filtrarIdEstado !== undefined) {
    dataSource = dataSource.filter(r => r.idestado === filtrarIdEstado);
  }

  if (dataSource.length === 0) {
    Swal.fire('Sin datos', 'No hay reservas para ese criterio', 'info');
    return;
  }

  /* 2) Asegurar lista de estados --------------------------- */
  if (this.estadosReserva.length === 0) {
    try {
      this.estadosReserva = await firstValueFrom(
        this.estadoService.getEstadoReserva()
      );
    } catch {/* seguirá mostrando “Sin estado” */}
  }

  /* 3) Preparar PDF ---------------------------------------- */
  const doc       = new jsPDF({ orientation:'landscape', unit:'pt', format:'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const headLines = [
    { txt:'DAAYFOOD S.A.S', size:16, bold:true },
    { txt:'Dirección: Dayuma, Vía principal, Calle C N/A y Km 40', size:11 },
    { txt:'Orellana-Ecuador', size:11 },
    { txt:'Teléfonos: 0992268003 – 0989989254', size:11 }
  ];
  let y = 36;
  headLines.forEach(l => {
    doc.setFontSize(l.size).setFont('helvetica', l.bold ? 'bold' : 'normal');
    doc.text(l.txt, pageWidth/2, y, { align:'center' });
    y += 16;
  });

  /* 4) Título dinámico ------------------------------------- */
  y += 8;
  const estadoTxTitulo =
    filtrarIdEstado === undefined
      ? ''
      : (this.estadosReserva.find(e => e.idestado === filtrarIdEstado)?.estado_reserva
         || 'Sin estado');

  const titulo = filtrarIdEstado === undefined
      ? 'LISTADO DE RESERVAS'
      : `RESERVAS – ${estadoTxTitulo}`;

  doc.setFontSize(13).setFont('helvetica','bold')
     .text(titulo, pageWidth/2, y, { align:'center' });
  y += 18;

  /* 5) Filas ----------------------------------------------- */
  const filas = dataSource.map(r => {
    const estObj   = this.estadosReserva.find(e => e.idestado === r.idestado);
    const estadoTx = estObj ? estObj.estado_reserva : 'Sin estado';
    return [
      r.idreserva,
      r.cliente?.ci     ?? '',
      r.cliente?.nombre ?? '',
      r.direccionevento ?? '',
      this.fmtFecha(r.fechaevento),
      this.fmtMoneda(r.total),
      this.fmtMoneda(r.primer_pago),
      this.fmtMoneda(r.segundo_pago),
      this.fmtMoneda(r.saldo_pendiente),
      estadoTx
    ];
  });

  /* 6) Columnas y tabla ------------------------------------ */
  autoTable(doc, {
    head: [[
      'Código','Cédula','Cliente','Dirección Evento','Fecha Evento',
      'Total','1.º Pago','2.º Pago','Saldo','Estado'
    ]],
    body      : filas,
    startY    : y,
    theme     : 'grid',
    headStyles: { fillColor:[63,81,181], textColor:255,
                  halign:'center', fontStyle:'bold' },
    bodyStyles: { fontSize:10, textColor:60 },
    styles    : { cellPadding:4, overflow:'linebreak' },
    columnStyles: {
      5:{ halign:'right' }, 6:{ halign:'right' },
      7:{ halign:'right' }, 8:{ halign:'right' }
    }
  });

  /* 7) Descargar ------------------------------------------- */
  const fileName = filtrarIdEstado === undefined
      ? 'Reservas.pdf'
      : `Reservas_${estadoTxTitulo.replace(/\s+/g, '_')}.pdf`;

  doc.save(fileName);
}

//---------------------------------------------------

/* ─────────────────── NUEVAS PROPIEDADES ─────────────────── */
 togglePagosPanel(): void {
    this.showPagosPanel = !this.showPagosPanel;
    if (!this.showPagosPanel) { this.pagosFiltrados = []; this.totalPagos = 0; }
  }

  /* ---------- FILTRAR PAGOS  (ahora incluye nombre del cliente) --------- */
  filtrarPagos(): void {

    if (!this.dateRange.desde || !this.dateRange.hasta) {
      Swal.fire('Fechas incompletas', 'Seleccione ambas fechas', 'info');
      return;
    }

    const ini = this.dateRange.desde!;
    const fin = this.dateRange.hasta!;

    this.pagosFiltrados = [];
    let totalCents = 0;

    this.reserva.forEach(r => {
      const fEvento = new Date(r.fechaevento);
      if (fEvento < ini || fEvento > fin) { return; }

      const p1 = +parseFloat((r.primer_pago  ?? 0).toString().replace(/[^\d.]/g,''));
      const p2 = +parseFloat((r.segundo_pago ?? 0).toString().replace(/[^\d.]/g,''));
      const cents = Math.round(p1 * 100) + Math.round(p2 * 100);

      if (cents) {
        this.pagosFiltrados.push({
          fecha   : r.fechaevento,
          reserva : r.idreserva,
          cliente : r.cliente?.nombre ?? '(sin nombre)',  // ← NUEVO
          monto   : cents / 100
        });
        totalCents += cents;
      }
    });

    this.totalPagos = totalCents / 100;

    this.dialog.open(PagosDialogComponent, {
      width: '700px',
      data : {
        pagos : this.pagosFiltrados,
        total : this.totalPagos,
        desde : this.dateRange.desde,
        hasta : this.dateRange.hasta
      }
    });
  }

  /* ---------- EXPORTAR PDF DE PAGOS  (con columna Cliente) ---------- */
  downloadPagosPdf(): void {
    if (!this.pagosFiltrados.length) {
      Swal.fire('Sin datos', 'Ejecute el filtro primero', 'info');
      return;
    }

    const doc       = new jsPDF({ orientation:'portrait', unit:'pt', format:'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    const fmtFecha = (d:string|Date) =>
          new Date(d).toLocaleDateString('es-EC');
    const fmtMon = (v:number) =>
          new Intl.NumberFormat('es-EC',{style:'currency', currency:'USD'}).format(v);

    doc.setFontSize(14).setFont('helvetica','bold')
       .text('Pagos – DaayFood', pageWidth/2, 40, { align:'center' });

    doc.setFontSize(11)
       .text(`Del ${fmtFecha(this.dateRange.desde!)} al ${fmtFecha(this.dateRange.hasta!)}`,
             pageWidth/2, 60, { align:'center' });

    autoTable(doc, {
      head:[['Cliente','Fecha','Reserva','Monto']],     // ← Cliente
      body:this.pagosFiltrados.map(p => [
        p.cliente, fmtFecha(p.fecha), p.reserva, fmtMon(p.monto)
      ]),
      startY:80,
      theme:'grid',
      styles:{ cellPadding:4 },
      columnStyles:{ 3:{ halign:'right' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont('helvetica','bold')
       .text(`TOTAL: ${fmtMon(this.totalPagos)}`,
             pageWidth - 120, finalY, { align:'right' });

    doc.save('Pagos.pdf');
  }

  /* ══════════════════════════════════════════════════════════ */
}

