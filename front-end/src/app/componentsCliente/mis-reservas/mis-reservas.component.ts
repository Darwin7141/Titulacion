declare const paypal: any;

import { Component, OnInit, Output, EventEmitter, ViewEncapsulation  } from '@angular/core';
import { ReservasService } from '../../services/reservas.service';
import { Router } from '@angular/router';
import { ClientesService } from '../../services/clientes.service';
import { MatDialog } from '@angular/material/dialog';
import { EditarReservaComponent } from '../editar-reserva/editar-reserva.component';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-mis-reservas',
  standalone: false,
  templateUrl: './mis-reservas.component.html',
  styleUrls: ['./mis-reservas.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class MisReservasComponent implements OnInit {

  reservas: any[] = [];
  hayNotificacion: boolean = false;
  metodoPago: string = '';
  mostrarFormularioPago: boolean = false;
  reservaId: string = '';
  numeroTarjeta: string = '';
  fechaExpiracion: string = '';
  cvc: string = '';
  titular: string = '';
  saldopendiente: number = 0;
  mostrarBotonPagoInicial: boolean = false;
  mostrarBotonPagoFinal: boolean = false;
  montoPago: number = 0;
  mensajes: { remitente: 'user' | 'bot'; texto: string }[] = [];
  searchTerm: string = '';
  allReservas: any[] = [];
  currentIndex = 0;
  loadingPago: boolean = false;

  /** guardamos el código del cliente para recargar sin perder posición */
  private codigocliente!: string | null;

  @Output() cerrar = new EventEmitter<void>();

  constructor(
    private reservasService: ReservasService,
    private router: Router,
    private clienteService: ClientesService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
    this.codigocliente = user?.codigocliente || null;

    if (this.codigocliente) {
      this.cargarReservasCliente(this.codigocliente);
    }
  }

  get hasReservas(): boolean {
    return this.reservas && this.reservas.length > 0;
  }

  get current() {
    return this.hasReservas ? this.reservas[this.currentIndex] : null;
  }

  /** ← ahora acepta stayOnId opcional para quedarnos en la misma reserva tras guardar */
  cargarReservasCliente(codigocliente: string, stayOnId?: string): void {
    this.reservasService.getReservasByCliente(codigocliente).subscribe({
      next: (resp) => {
        this.reservas = resp;
        this.allReservas = resp;

        this.reservas.forEach(r => {
          const saldo  = Number(r.saldo_pendiente) || 0;

          const idEstado: number =
          Number(r.idestado ??
                 r.estado?.idestado ??
                 r.nombre?.idestado ??          // por si venía así antes
                 NaN);

          r.mostrarBotonPagoInicial = false;
          r.mostrarBotonPagoFinal   = false;
          r.mostrarComprobante      = false;

          switch (idEstado) {
          case 2: // Aceptada
            r.mostrarBotonPagoInicial = true;
            break;
          case 3: // En proceso
            r.mostrarBotonPagoFinal = true;
            break;
          case 4: // Cancelada
            break;
          case 5: // Pagada
            r.mostrarComprobante = true;
            break;
          default:
            // fallback si no se obtuvo el id, o por cualquier incoherencia
            if (saldo > 0) r.mostrarBotonPagoFinal = true;
            break;
        }
      });


        // Mantenerse en la misma tarjeta si viene stayOnId
        if (stayOnId) {
          const idx = this.reservas.findIndex(r => r.idreserva === stayOnId);
          this.currentIndex = idx >= 0 ? idx : 0;
        } else {
          this.currentIndex = 0;
        }
      },
      error: (err) => console.error('Error al obtener reservas del cliente:', err)
    });
  }

  nextReserva(): void {
    if (!this.hasReservas) return;
    this.currentIndex = (this.currentIndex + 1) % this.reservas.length;
  }
  prevReserva(): void {
    if (!this.hasReservas) return;
    this.currentIndex = (this.currentIndex - 1 + this.reservas.length) % this.reservas.length;
  }

  search(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.reservas = term
      ? this.allReservas.filter(r => r.idreserva.toLowerCase().includes(term))
      : [...this.allReservas];
    this.currentIndex = 0;
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.reservas   = [...this.allReservas];
    this.currentIndex = 0;
  }

  volver(): void {
    this.cerrar.emit();
  }

  descargarComprobante(reserva: any) {
    const codigocliente = reserva.codigocliente;
    this.clienteService.getClientePorCodigo(codigocliente).subscribe({
      next: (clienteData) => this.generarPDFconDatosCliente(reserva, clienteData),
      error: (err) => {
        console.error('No se pudieron cargar los datos del cliente:', err);
        Swal.fire('Error', 'No se pudieron obtener los datos del cliente para el comprobante.', 'error');
      }
    });
  }

private generarPDFconDatosCliente(reserva: any, cliente: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 12;                // margen
  const GAP = 6;               // separación entre cajas
  const rightBoxW = 78;        // ancho caja derecha (fecha/estado)
  const topBoxH = 34;          // alto de ambas cajas
  const leftBoxW = W - (M * 2) - rightBoxW - GAP;

  // Helpers
  const dinero = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;
  const txt = (s: any) => String(s ?? '').trim();

  const fechaActual = new Date().toLocaleDateString();
  const estado = txt(reserva?.nombre?.estado_reserva || reserva?.estado || reserva?.idestado);
  const nroComp = txt(reserva?.idreserva);

  // ⬇️ tu logo en assets (tal como lo mostraste en la captura)
  const LOGO_SRC = 'assets/LOGOMODIDFICADO.png';

  // Texto bajo el logo
  const DIR1 = 'Dayuma, Vía principal, Calle C N/A y Km 40';
  //const DIR2 = 'Orellana – Ecuador';
  const TEL  = 'Teléfonos: 0992268003 – 0989989254';

  const render = (logoImg?: HTMLImageElement, logoSize = { w: 0, h: 0 }) => {
    /* ─────────────────────── Encabezado sin franja ─────────────────────── */
    let y = M; // punto de inicio arriba

    // Logo centrado
    if (logoImg && logoSize.w > 0 && logoSize.h > 0) {
      const x = (W - logoSize.w) / 2;
      doc.addImage(logoImg, 'PNG', x, y, logoSize.w, logoSize.h);
      y += logoSize.h + 4; // espacio bajo el logo
    }

    // Dirección (negrita) y teléfonos centrados
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text(DIR1, W / 2, y, { align: 'center' }); y += 5;
   // doc.text(DIR2, W / 2, y, { align: 'center' }); y += 6;
    doc.setFont('helvetica', 'normal');
    doc.text(TEL,  W / 2, y, { align: 'center' }); y += 10;

    // Título
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
    doc.text('COMPROBANTE DE PAGO', W / 2, y, { align: 'center' });
    y += 8;

    /* ──────────── Caja izquierda: datos del cliente ──────────── */
    doc.setLineWidth(0.4);
    doc.rect(M, y, leftBoxW, topBoxH);

    let x = M + 4;
    let yc = y + 8;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('Cliente', x, yc);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);

    yc += 6;  doc.text(`Nombre: ${txt(cliente?.nombre)}`, x, yc);
    yc += 5;  doc.text(`Cédula: ${txt(cliente?.ci)}`, x, yc);
    yc += 5;  doc.text(`Dirección: ${txt(cliente?.direccion)}`, x, yc);
    yc += 5;  doc.text(`Teléfono: ${txt(cliente?.telefono)}`, x, yc);

    /* ──────────── Caja derecha: cabecera del comprobante ──────────── */
    const boxX = M + leftBoxW + GAP;
    const boxY = y;

    doc.rect(boxX, boxY, rightBoxW, topBoxH);
    const rowH = topBoxH / 3;
    doc.line(boxX, boxY + rowH,     boxX + rightBoxW, boxY + rowH);
    doc.line(boxX, boxY + rowH * 2, boxX + rightBoxW, boxY + rowH * 2);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('N° Comprobante:', boxX + 4,         boxY + 6);
    doc.text('Fecha:',          boxX + 4,         boxY + rowH + 6);
    doc.text('Estado:',         boxX + 4,         boxY + rowH * 2 + 6);

    doc.setFont('helvetica', 'normal');
    doc.text(nroComp,       boxX + rightBoxW - 4, boxY + 6,            { align: 'right' });
    doc.text(fechaActual,   boxX + rightBoxW - 4, boxY + rowH + 6,     { align: 'right' });
    doc.text(estado || '-', boxX + rightBoxW - 4, boxY + rowH * 2 + 6, { align: 'right' });

    const tableX = M;
const tableY = boxY + topBoxH + 10;
const tableW = W - M * 2;

// Definición de columnas
const cols = [
  { title: 'MENÚ',         w: tableW * 0.48, align: 'left'  as const },
  { title: 'CANTIDAD',     w: tableW * 0.16, align: 'right' as const },
  { title: 'PRECIO UNIT.', w: tableW * 0.18, align: 'right' as const },
  { title: 'SUBTOTAL',     w: tableW * 0.18, align: 'right' as const },
];

// Encabezado
let cx = tableX;
const th = 8;
doc.setLineWidth(0.4);
doc.setFillColor(245, 245, 245);

// ⬅️ antes: 'F'. Ahora 'FD' = fill + draw (para que se vea la línea superior)
doc.rect(tableX, tableY, tableW, th, 'FD');

doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
cols.forEach(c => {
  const tx = cx + (c.align === 'right' ? c.w - 2 : 2);
  doc.text(c.title, tx, tableY + 5, { align: c.align });
  cx += c.w;
});

// Líneas verticales del header (opcional, ya hay borde por el rect, pero lo dejamos)
cx = tableX;
doc.line(tableX, tableY, tableX, tableY + th);
cols.forEach(c => { cx += c.w; doc.line(cx, tableY, cx, tableY + th); });

// Cuerpo
doc.setFont('helvetica', 'normal');
const rowH2 = 8;
let yRow = tableY + th;

reserva?.detalles?.forEach((it: any) => {
  // marco de fila
  doc.rect(tableX, yRow, tableW, rowH2);

  // separadores por columna
  let vx = tableX;
  cols.forEach(c => { vx += c.w; doc.line(vx, yRow, vx, yRow + rowH2); });

  // textos de la fila
  let txStart = tableX;
  const valores = [
    txt(it?.menu?.nombre || it?.nombre || '-'),
    String(it?.cantpersonas ?? it?.cantidad ?? 0),
    dinero(it?.preciounitario),
    dinero(it?.subtotal),
  ];
  cols.forEach((c, i) => {
    const cellX = txStart + (c.align === 'right' ? c.w - 2 : 2);
    doc.text(valores[i], cellX, yRow + 5, { align: c.align });
    txStart += c.w;
  });

  yRow += rowH2;
});

/* ─────────────────────── Total alineado por columnas ─────────────────────── */
const pad = 2; // pequeño padding interno a la derecha
const col1Right = tableX + cols[0].w;
const col2Right = col1Right + cols[1].w;
const col3Right = col2Right + cols[2].w; 
const col4Right = col3Right + cols[3].w; 

const totalY = yRow + 6;
doc.setFont('helvetica', 'bold'); doc.setFontSize(11);

// “Total:” alineado al borde derecho de la col. 3
doc.text('Total:', col3Right - pad, totalY, { align: 'right' });

// Monto alineado al borde derecho de la col. 4 (subtotal)
doc.text(dinero(reserva?.total), col4Right - pad, totalY, { align: 'right' });
    

    doc.save(`comprobante_${nroComp || 'reserva'}.pdf`);
  };

  // Cargar logo (si falla, render sin logo)
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = LOGO_SRC;

  img.onload = () => {
    const logoW = 55;                            // tamaño del logo (ajustable)
    const ratio  = img.width ? (img.height / img.width) : 0.36;
    const logoH = +(logoW * ratio).toFixed(2);
    render(img, { w: logoW, h: logoH });
  };
  img.onerror = () => render();
}


  /** Editar ahora abre un modal y no navega */
  editarReserva(idreserva: string) {
    const dialogRef = this.dialog.open(EditarReservaComponent, {
      width: 'auto',
      panelClass: 'dialog-reserva', 
      
     // disableClose: true,
      //autoFocus: false,
      data: { idreserva }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result?.updated && this.codigocliente) {
        // recarga manteniendo visible esa misma reserva
        this.cargarReservasCliente(this.codigocliente, idreserva);
      }
    });
  }

  eliminarReserva(idreserva: string) {
    if (!confirm('¿Está seguro de eliminar esta reserva?')) return;

    this.reservasService.deleteReserva(idreserva).subscribe({
      next: () => {
        this.reservas = this.reservas.filter(r => r.idreserva !== idreserva);
      },
      error: (err) => {
        console.error('Error al eliminar reserva:', err);
      }
    });
  }

  private swalOk(titulo: string, desc = '') {
  Swal.fire({
    width: 480,
    html: `
      <div class="swal-pro-check"></div>
      <h2 class="swal-pro-title">${titulo}</h2>
      ${desc ? `<p class="swal-pro-desc">${desc}</p>` : ''}
    `,
    showConfirmButton: true,
    confirmButtonText: 'Listo',
    showCancelButton: false,
    buttonsStyling: false,
    customClass: {
      popup: 'swal-pro',
      confirmButton: 'swal-pro-confirm',
      htmlContainer: 'swal-pro-html'
    }
  });
}




  realizarPrimerPago(reservaId: string, saldopendiente: number): void {
    Swal.fire({
      title: 'Pago inicial',
      html: `
        <label for="montoPago">Monto a pagar:</label>
        <input type="number" id="montoPago" class="swal2-input" value="${(saldopendiente / 2).toFixed(2)}" min="0" max="${saldopendiente}">
      `,
      showCancelButton: true,
      confirmButtonText: 'Pagar',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'paypal-modal', title: 'paypal-title' }
    }).then((result) => {
      if (result.isConfirmed) {
        const montoPago = parseFloat((document.getElementById('montoPago') as HTMLInputElement).value);
        this.pagarPrimerPago(reservaId, montoPago);
      }
    });
  }

  pagarPrimerPago(reservaId: string, montoPago: number): void {
    this.reservasService.procesarPrimerPago(reservaId, montoPago).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Pago inicial realizado',
          text: 'El primer pago se ha realizado exitosamente.',
        });

        let reserva = response.reserva;

        if (reserva.pagorealizado + montoPago === reserva.total) {
          reserva.saldopendiente = 0;
          reserva.idestado = 'Pagada';
        } else {
          reserva.saldopendiente = reserva.total - reserva.pagorealizado;
          reserva.idestado = 'Aceptada';
        }

        reserva.pagorealizado += montoPago;

        const cliente = JSON.parse(localStorage.getItem('identity_user') || '{}');
        const nombreCliente = cliente.nombre || 'Cliente desconocido';

        const pagosJSON = localStorage.getItem('pagosPendientes');
        const pagosPendientes: any[] = pagosJSON ? JSON.parse(pagosJSON) : [];

        pagosPendientes.push({
          reservaId,
          clienteNombre: nombreCliente,
          tipoPago: 'Primer pago',
          fecha: new Date().toISOString()
        });

        localStorage.setItem('pagosPendientes', JSON.stringify(pagosPendientes));
        window.dispatchEvent(new CustomEvent('nuevosPagosActualizado'));

        this.cargarReservasCliente(reserva.codigocliente);
      },
      error: (err) => {
        console.error('Error al procesar el primer pago:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error al procesar el pago',
          text: 'Hubo un problema al procesar el pago inicial. Intenta nuevamente.',
        });
      }
    });
  }

  realizarSegundoPago(reservaId: string, saldopendiente: number): void {
    Swal.fire({
      title: 'Pago final',
      html: `
        <label for="montoPagoFinal">Monto a pagar:</label>
        <input type="number" id="montoPagoFinal" class="swal2-input" value="${saldopendiente}" min="0" max="${saldopendiente}">
      `,
      showCancelButton: true,
      confirmButtonText: 'Pagar',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'paypal-modal', title: 'paypal-title' }
    }).then((result) => {
      if (result.isConfirmed) {
        const montoPago = parseFloat((document.getElementById('montoPagoFinal') as HTMLInputElement).value);
        this.pagarSegundoPago(reservaId, montoPago, saldopendiente);
      }
    });
  }

  pagarSegundoPago(reservaId: string, montoPago: number, saldopendiente: number): void {
    this.reservasService.procesarSegundoPago(reservaId, montoPago).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Pago final realizado',
          text: 'El segundo pago se ha realizado exitosamente. La reserva ha sido marcada como pagada.',
        });

        let reserva = response.reserva;

        reserva.saldopendiente = montoPago;

        if (reserva.pagorealizado + reserva.saldopendiente === reserva.total) {
          reserva.idestado = 'Pagada';
        }

        const cliente = JSON.parse(localStorage.getItem('identity_user') || '{}');
        const nombreCliente = cliente.nombre || 'Cliente desconocido';

        const pagosJSON = localStorage.getItem('pagosPendientes');
        const pagosPendientes: any[] = pagosJSON ? JSON.parse(pagosJSON) : [];

        pagosPendientes.push({
          reservaId,
          clienteNombre: nombreCliente,
          tipoPago: 'Segundo pago',
          fecha: new Date().toISOString()
        });

        localStorage.setItem('pagosPendientes', JSON.stringify(pagosPendientes));
        window.dispatchEvent(new CustomEvent('nuevosPagosActualizado'));

        this.cargarReservasCliente(reserva.codigocliente);
      },
      error: (err) => {
        console.error('Error al procesar el segundo pago:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error al procesar el pago',
          text: 'Hubo un problema al procesar el segundo pago. Intenta nuevamente.',
        });
      }
    });
  }

  cambiarEstadoAPagado(idreserva: string): void {
    this.reservasService.editarReserva(idreserva, 'Pagada').subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Reserva pagada',
          text: 'El estado de la reserva ha cambiado a "Pagada".',
        });
        this.cargarReservasCliente(response.reserva.codigocliente);
      },
      error: (err) => {
        console.error('Error al cambiar el estado de la reserva:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error al cambiar el estado',
          text: 'Hubo un problema al actualizar el estado de la reserva. Intenta nuevamente.',
        });
      }
    });
  }

  pagarReserva(idreserva: string, saldopendiente: number): void {
    this.reservaId = idreserva;

    if (saldopendiente == null || saldopendiente === 0) {
      saldopendiente = 0;
    }

  }


 

  abrirPayPal(tipo: 'inicial' | 'final', reserva: any) {
    const montoPago = tipo === 'inicial'
      ? +(reserva.total / 2).toFixed(2)
      : +reserva.saldo_pendiente.toFixed(2);

    Swal.fire({
      title: `Pago ${ tipo === 'inicial' ? 'Inicial' : 'Final' }`,
      html: `<div id="paypal-container-${reserva.idreserva}" style="margin-top: 16px;"></div>`,
      showConfirmButton: false,
      width: 460,
      customClass: { popup: 'paypal-modal', title: 'paypal-title' },
      didOpen: () => {
        const paypalSDK = (window as any).paypal;
        if (!paypalSDK || !paypalSDK.Buttons) {
          Swal.showValidationMessage('PayPal SDK no se pudo cargar. Recarga la página.');
          return;
        }

        paypalSDK.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
          createOrder: (_data: any, actions: any) =>
            actions.order.create({
              purchase_units: [{ amount: { value: montoPago.toString() } }],
              application_context: { shipping_preference: 'NO_SHIPPING' }
            }),
        onApprove: async (_data: any, actions: any) => {
            try {
              
              
              const detalle = await actions.order.capture();
              const pagado = +detalle.purchase_units[0].amount.value;

              let obs$;
              if (tipo === 'inicial') {
                obs$ = this.reservasService.procesarPrimerPago(reserva.idreserva, pagado);
              } else {
                obs$ = this.reservasService.procesarSegundoPago(reserva.idreserva, pagado);
              }

              obs$.subscribe({
                next: (response) => {
                  this.cargarReservasCliente(reserva.codigocliente);

                  const clienteStorage: any = JSON.parse(localStorage.getItem('identity_user') || '{}');
                  const nombreCliente = clienteStorage.nombre || 'Cliente desconocido';

                  const pagosJSON = localStorage.getItem('pagosPendientes') || '[]';
                  const pagosPendientes: Array<any> = JSON.parse(pagosJSON);

                  pagosPendientes.push({
                    reservaId: reserva.idreserva,
                    clienteNombre: nombreCliente,
                    tipoPago: tipo === 'inicial' ? 'Primer pago' : 'Segundo pago',
                    fecha: new Date().toISOString()
                  });

                  localStorage.setItem('pagosPendientes', JSON.stringify(pagosPendientes));
                  window.dispatchEvent(new CustomEvent('nuevosPagosActualizado'));

                  Swal.close();
                  this.swalOk('Pago realizado', 'Tu pago se realizó exitosamente.');
                },
                error: err => {
                  console.error('Error al notificar backend:', err);
                  Swal.showValidationMessage('Hubo un error al procesar el pago en el sistema.');
                }
              });
            } catch (err) {
              console.error('onApprove error:', err);
              Swal.showValidationMessage('Hubo un error al capturar el pago.');
            }
          },
          onError: (err: any) => {
            console.error('PayPal Buttons onError:', err);
            Swal.showValidationMessage('Error al procesar el pago en PayPal.');
          }
        }).render(`#paypal-container-${reserva.idreserva}`);
      }
    });
  }

  cancelarReserva(reserva: any) {
  const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
  const nombre = user.nombre || 'Cliente';
  const codigocliente = user.codigocliente;

  Swal.fire({
    width: 520,
    html: `
      <div class="swal-pro-warn"></div>
      <h2 class="swal-pro-title">Estimado/a ${nombre}</h2>
      <p class="swal-pro-desc">
        Por políticas internas de la empresa, le informamos que al solicitar la cancelación de su reserva,
        perderá cualquier abono económico realizado anteriormente. ¿Deseas continuar con la cancelación de tu
        reserva?
      </p>
    `,
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'No',
    buttonsStyling: false,
    customClass: {
      popup: 'swal-pro',
      confirmButton: 'swal-pro-yes',
      cancelButton: 'swal-pro-cancel',
      htmlContainer: 'swal-pro-html'
    }
  }).then(result => {
    if (result.isConfirmed) {
      this.enviarSolicitudCancelacion(reserva.idreserva, codigocliente);
    } else {
      this.router.navigate(['/inicioCliente']);
    }
  });
}

  private enviarSolicitudCancelacion(idreserva: string, codigocliente: string) {
    this.reservasService.solicitarCancelacion(idreserva, codigocliente)
    .subscribe({
      next: () => {
        Swal.fire({
          width: 480,
          html: `
            <div class="swal-pro-check"></div>
            <h2 class="swal-pro-title">Enviado</h2>
            <p class="swal-pro-desc">
              Su solicitud para cancelar su reserva ha sido enviada.
            </p>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Listo',
          showCancelButton: false,
          buttonsStyling: false,
          customClass: {
            popup: 'swal-pro',
            confirmButton: 'swal-pro-confirm',
            htmlContainer: 'swal-pro-html'
          }
        });
      },
      error: () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo enviar la solicitud. Intente más tarde.',
          confirmButtonText: 'Entendido'
        });
      }
    });
  }

  private estadoPlano(r: any): string {
  const v = r?.nombre?.estado_reserva
         ?? r?.estado_reserva
         ?? r?.estado?.nombre
         ?? r?.idestado
         ?? '';
  return String(v).trim().toLowerCase();
}

puedeEditar(r: any): boolean {
  return !['en proceso','cancelada','pagada'].includes(this.estadoPlano(r));
}

esCancelada(r: any): boolean {
  return this.estadoPlano(r) === 'cancelada';
}
esPagada(r: any): boolean {
  return this.estadoPlano(r) === 'pagada';
}
}






