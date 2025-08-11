declare const paypal: any;

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ReservasService } from '../../services/reservas.service';
import { Router } from '@angular/router';
import { ClientesService } from '../../services/clientes.service';
import { MatDialog } from '@angular/material/dialog';
import { EditarReservaComponent } from '../editar-reserva/editar-reserva.component';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-mis-reservas',
  standalone: false,
  templateUrl: './mis-reservas.component.html',
  styleUrls: ['./mis-reservas.component.css']
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
          const pagado = Number(r.primer_pago)    || 0;
          const saldo  = Number(r.saldo_pendiente)|| 0;
          const estado = r.nombre?.estado_reserva;

          r.mostrarBotonPagoInicial = false;
          r.mostrarBotonPagoFinal   = false;
          r.mostrarComprobante      = false;

          switch (estado) {
            case 'Aceptada':
              r.mostrarBotonPagoInicial = true;
              break;
            case 'En proceso':
              r.mostrarBotonPagoFinal = true;
              break;
            case 'Pagada':
              r.mostrarComprobante = true;
              break;
            case 'Cancelada':
              break;
            default:
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

  private generarPDFconDatosCliente(reserva: any, clienteData: any) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const titleText = 'COMPROBANTE DE PAGO';
    doc.text(titleText, (pageWidth - doc.getTextWidth(titleText)) / 2, 20);

    const fechaActual = new Date().toLocaleDateString();
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${fechaActual}`, 10, 30);

    doc.text(`Nombre: ${clienteData.nombre}`, 10, 35);
    doc.text(`Cédula: ${clienteData.ci}`, 10, 40);
    doc.text(`Dirección: ${clienteData.direccion}`, 10, 45);
    doc.text(`Teléfono: ${clienteData.telefono}`, 10, 50);

    let yPos = 60;
    doc.setFont('helvetica', 'bold');
    doc.text('MENÚ', 10, yPos);
    doc.text('CANTIDAD', 60, yPos);
    doc.text('PRECIO UNIT.', 110, yPos);
    doc.text('SUBTOTAL', 160, yPos);
    doc.line(10, yPos + 2, pageWidth - 10, yPos + 2);
    yPos += 10;

    doc.setFont('helvetica', 'normal');
    reserva.detalles.forEach((item: any) => {
      doc.text(item.menu.nombre, 10, yPos);
      doc.text(item.cantpersonas.toString(), 60, yPos);
      doc.text(`$${item.preciounitario.toFixed(2)}`, 110, yPos);
      doc.text(`$${item.subtotal.toFixed(2)}`, 160, yPos);
      yPos += 10;
    });

    doc.line(10, yPos, pageWidth - 10, yPos);
    yPos += 10;

    doc.setFont('helvetica', 'bold');
    doc.text(`Total: $${reserva.total.toFixed(2)}`, pageWidth - 40, yPos);

    doc.save('comprobante_reserva.pdf');
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

  realizarPrimerPago(reservaId: string, saldopendiente: number): void {
    Swal.fire({
      title: 'Pago inicial',
      html: `
        <label for="montoPago">Monto a pagar:</label>
        <input type="number" id="montoPago" class="swal2-input" value="${(saldopendiente / 2).toFixed(2)}" min="0" max="${saldopendiente}">
      `,
      showCancelButton: true,
      confirmButtonText: 'Pagar',
      cancelButtonText: 'Cancelar'
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
      cancelButtonText: 'Cancelar'
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

    Swal.fire({
      title: 'Pago con tarjeta',
      html: `
        <label for="montoPago">Monto a pagar:</label>
        <input type="number" id="montoPago" class="swal2-input" value="${saldopendiente.toFixed(2)}" min="0" max="${saldopendiente}" placeholder="Monto a pagar"><br>
        <label for="numeroTarjeta">Número de tarjeta:</label>
        <input type="text" id="numeroTarjeta" class="swal2-input" placeholder="1234 1234 1234 1234" maxlength="19"><br>
        <label for="fechaExpiracion">Fecha de expiración:</label>
        <input type="text" id="fechaExpiracion" class="swal2-input" placeholder="MM/AA"><br>
        <label for="cvc">CVC:</label>
        <input type="text" id="cvc" class="swal2-input" placeholder="CVC"><br>
        <label for="titular">Titular de la tarjeta:</label>
        <input type="text" id="titular" class="swal2-input" placeholder="Nombre completo"><br>
      `,
      showCancelButton: true,
      confirmButtonText: 'Pagar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const montoPago = parseFloat((document.getElementById('montoPago') as HTMLInputElement).value);
        const numeroTarjeta = (document.getElementById('numeroTarjeta') as HTMLInputElement).value;
        const fechaExpiracion = (document.getElementById('fechaExpiracion') as HTMLInputElement).value;
        const cvc = (document.getElementById('cvc') as HTMLInputElement).value;
        const titular = (document.getElementById('titular') as HTMLInputElement).value;

        this.pagarConTarjeta(idreserva, saldopendiente, montoPago, numeroTarjeta, fechaExpiracion, cvc, titular);
      }
    });
  }

  pagarConTarjeta(idreserva: string, saldopendiente: number, montoPago: number, numeroTarjeta: string, fechaExpiracion: string, cvc: string, titular: string): void {
    this.reservasService.procesarPagoConTarjeta(idreserva, saldopendiente, montoPago, numeroTarjeta, fechaExpiracion, cvc, titular).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Pago con tarjeta realizado',
          text: 'El pago con tarjeta fue realizado exitosamente.',
        });

        this.cargarReservasCliente(response.reserva.codigocliente);

        if (montoPago < saldopendiente) {
          this.mostrarBotonPagoFinal = true;
          this.mostrarBotonPagoInicial = false;
        } else {
          this.mostrarBotonPagoFinal = false;
        }
      },
      error: (err) => {
        console.error('Error al procesar el pago con tarjeta:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error al procesar el pago',
          text: 'Hubo un problema al procesar el pago. Intenta nuevamente.',
        });
      }
    });
  }

  mostrarPayPal(_reserva: any) {
    // reservado por si lo necesitas
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
      customClass: { popup: 'paypal-modal' },
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
                  Swal.fire('¡Pago registrado!', 'Gracias por tu pago.', 'success');
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
      icon: 'warning',
      title: `Estimado/a ${nombre}`,
      text: `Por políticas internas de la empresa, le informamos que al solicitar la cancelación de su reserva, perderá cualquier abono económico realizado anteriormente. ¿Deseas continuar con la cancelación de tu reserva?`,
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
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
            icon: 'success',
            title: 'Enviado',
            text: 'Su solicitud para cancelar su reserva ha sido enviada.',
            confirmButtonText: 'OK'
          });
        },
        error: () => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo enviar la solicitud. Intente más tarde.',
            confirmButtonText: 'OK'
          });
        }
      });
  }
}






