declare const paypal: any;

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ReservasService } from '../../services/reservas.service';
import { Router } from '@angular/router';
import { ClientesService } from '../../services/clientes.service';
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
  metodoPago: string = '';  // Variable para almacenar el método de pago seleccionado
  mostrarFormularioPago: boolean = false;  // Inicialmente no mostramos el formulario de pago
  reservaId: string = '';  // Para identificar cuál reserva tiene el formulario abierto
  numeroTarjeta: string = '';
  fechaExpiracion: string = '';
  cvc: string = '';
  titular: string = '';
  saldopendiente: number = 0;
  mostrarBotonPagoInicial: boolean = false;  // Mostrar el botón de pago inicial por defecto
  mostrarBotonPagoFinal: boolean = false;  // El botón de pago final debe estar oculto inicialmente
  montoPago: number = 0;
  mensajes: { remitente: 'user' | 'bot'; texto: string }[] = [];
  searchTerm: string = '';
  allReservas: any[] = [];
  currentIndex = 0;
  @Output() cerrar = new EventEmitter<void>();

  constructor(
    private reservasService: ReservasService,
    private router: Router,
    private clienteService: ClientesService,
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
    const codigocliente = user?.codigocliente || null;

    if (codigocliente) {
      this.cargarReservasCliente(codigocliente);
    }
    
  }

  get hasReservas(): boolean {
    return this.reservas && this.reservas.length > 0;
  }
  get current() {                             // ← reserva actual
    return this.hasReservas ? this.reservas[this.currentIndex] : null;
  }

  cargarReservasCliente(codigocliente: string): void {
  this.reservasService.getReservasByCliente(codigocliente).subscribe({
    next: (resp) => {
      this.reservas = resp;
      this.allReservas = resp;
      this.currentIndex = 0;

      this.reservas.forEach(r => {
        const pagado = Number(r.primer_pago)    || 0;
        const saldo  = Number(r.saldo_pendiente)|| 0;
        const estado = r.nombre?.estado_reserva;

        // 1) Inicializo todo a false
        r.mostrarBotonPagoInicial = false;
        r.mostrarBotonPagoFinal   = false;
        r.mostrarComprobante      = false;

        // 2) Segun el estado:
        switch (estado) {
          case 'Aceptada':
            // Solo inicial
            r.mostrarBotonPagoInicial = true;
            break;

          case 'En proceso':
            // Solo final
            r.mostrarBotonPagoFinal = true;
            break;

          case 'Pagada':
            // Solo comprobante
            r.mostrarComprobante = true;
            break;

          case 'Cancelada':
            // Ningún botón
            break;

          default:
            // Si quisieras contemplar el caso en que hayan hecho el primer pago
            // y saldo > 0 pero sigan en 'Aceptada', podrías activar final aquí:
            if (saldo > 0) {
              r.mostrarBotonPagoFinal = true;
            }
            break;
        }
      });
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
    this.currentIndex = 0;                    // ← resetea al 1.º resultado
  }

/** Limpia el filtro y vuelve a cargar todo */
clearSearch(): void {
  this.searchTerm = '';
  this.reservas   = [...this.allReservas];
  this.currentIndex = 0;
}

volver(): void {
    this.cerrar.emit();
  }

  descargarComprobante(reserva: any) {
    // 1) Llamamos al backend para obtener datos completos del cliente:
    const codigocliente = reserva.codigocliente;
    this.clienteService.getClientePorCodigo(codigocliente).subscribe({
      next: (clienteData) => {
        // 2) Cuando llega la respuesta, generamos el PDF:
        this.generarPDFconDatosCliente(reserva, clienteData);
      },
      error: (err) => {
        console.error('No se pudieron cargar los datos del cliente:', err);
        Swal.fire('Error', 'No se pudieron obtener los datos del cliente para el comprobante.', 'error');
      }
    });
  }

  private generarPDFconDatosCliente(reserva: any, clienteData: any) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // — Título centrado —
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const titleText = 'COMPROBANTE DE PAGO';
    doc.text(titleText, (pageWidth - doc.getTextWidth(titleText)) / 2, 20);

    // — Fecha actual —
    const fechaActual = new Date().toLocaleDateString(); // e.j. "3/6/2025"
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${fechaActual}`, 10, 30);

    // — Datos del cliente obtenidos del backend —
    doc.text(`Nombre: ${clienteData.nombre}`, 10, 35);
    doc.text(`Cédula: ${clienteData.ci}`, 10, 40);
    doc.text(`Dirección: ${clienteData.direccion}`, 10, 45);
    doc.text(`Teléfono: ${clienteData.telefono}`, 10, 50);

    // — Encabezados de la tabla —
    let yPos = 60;
    doc.setFont('helvetica', 'bold');
    doc.text('MENÚ', 10, yPos);
    doc.text('CANTIDAD', 60, yPos);
    doc.text('PRECIO UNIT.', 110, yPos);
    doc.text('SUBTOTAL', 160, yPos);

    // Dibujamos una línea debajo de los encabezados
    doc.line(10, yPos + 2, pageWidth - 10, yPos + 2);
    yPos += 10;

    // — Filas con los detalles de la reserva —
    doc.setFont('helvetica', 'normal');
    reserva.detalles.forEach((item: any) => {
      doc.text(item.menu.nombre, 10, yPos);
      doc.text(item.cantpersonas.toString(), 60, yPos);
      doc.text(`$${item.preciounitario.toFixed(2)}`, 110, yPos);
      doc.text(`$${item.subtotal.toFixed(2)}`, 160, yPos);
      yPos += 10;
    });

    // — Línea final de la tabla —
    doc.line(10, yPos, pageWidth - 10, yPos);
    yPos += 10;

    // — Total —
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: $${reserva.total.toFixed(2)}`, pageWidth - 40, yPos);

    // — Descargar PDF —
    doc.save('comprobante_reserva.pdf');
  }


  editarReserva(idreserva: string) {
    this.router.navigate(['/editarReservas', idreserva]);
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
        
        // Si el pago es igual al total, el saldo pendiente debe ser 0 y el estado cambia a Pagada
        if (reserva.pagorealizado + montoPago === reserva.total) {
          reserva.saldopendiente = 0; // Saldo pendiente se pone a 0
          reserva.idestado = 'Pagada'; // Cambiar estado a Pagada
        } else {
          reserva.saldopendiente = reserva.total - reserva.pagorealizado; // Mantener el saldo pendiente
          reserva.idestado = 'Aceptada'; // Mantener estado como Aceptada si el saldo no se paga completamente
        }
  
        // Actualizar los valores de la reserva
        reserva.pagorealizado += montoPago; // Actualizamos el pago realizado
        
        const cliente = JSON.parse(localStorage.getItem('identity_user') || '{}');
      const nombreCliente = cliente.nombre || 'Cliente desconocido';

      // 2) Leer / inicializar el arreglo de pagos pendientes
      const pagosJSON = localStorage.getItem('pagosPendientes');
      const pagosPendientes: any[] = pagosJSON ? JSON.parse(pagosJSON) : [];

      // 3) Agregar un nuevo objeto al array
      pagosPendientes.push({
        reservaId,                            // id de la reserva pa referencia visual
        clienteNombre: nombreCliente,         // nombre del cliente
        tipoPago: 'Primer pago',              // texto fijo para indicar primer pago
        fecha: new Date().toISOString()       // opcional: marca de tiempo
      });


      
      // 4) Volver a escribirlo en localStorage
      localStorage.setItem('pagosPendientes', JSON.stringify(pagosPendientes));

      // 5) Emitir un evento custom para la misma pestaña
      window.dispatchEvent(new CustomEvent('nuevosPagosActualizado'));

        // Recargar las reservas del cliente
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
  

  // Realizar pago final
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
  
      // Actualizar el saldo pendiente con el segundo pago
      reserva.saldopendiente = montoPago; // El saldo pendiente ahora se pone con el valor del segundo pago
  
      // Verificar si la suma de pago realizado y saldo pendiente es igual al total, cambiar el estado a "Pagada"
      if (reserva.pagorealizado + reserva.saldopendiente === reserva.total) {
        reserva.idestado = 'Pagada'; // Cambiar el estado a Pagada
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
      // → FIN BLOQUE NOTIFICACIÓN
      // Recargar las reservas del cliente
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

  // Cambiar el estado de la reserva a "Pagada"
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

  // Seleccionar el método de pago
  pagarReserva(idreserva: string, saldopendiente: number): void {
    this.reservaId = idreserva;

    if (saldopendiente == null || saldopendiente === 0) {
      saldopendiente = 0;  // Asigna un valor por defecto
    }
    
    // Mostrar el formulario de pago con SweetAlert2 dentro del modal
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
        // Obtener valores del formulario y realizar el pago con la tarjeta
        const montoPago = parseFloat((document.getElementById('montoPago') as HTMLInputElement).value);
        const numeroTarjeta = (document.getElementById('numeroTarjeta') as HTMLInputElement).value;
        const fechaExpiracion = (document.getElementById('fechaExpiracion') as HTMLInputElement).value;
        const cvc = (document.getElementById('cvc') as HTMLInputElement).value;
        const titular = (document.getElementById('titular') as HTMLInputElement).value;
  
        // Realizar el pago con los datos de la tarjeta
        this.pagarConTarjeta(idreserva, saldopendiente, montoPago, numeroTarjeta, fechaExpiracion, cvc, titular);
      }
    });
  }
  
  // Función para procesar el pago con tarjeta
  // Función para procesar el pago con tarjeta (el monto puede ser el inicial o final)
  pagarConTarjeta(idreserva: string, saldopendiente: number, montoPago: number, numeroTarjeta: string, fechaExpiracion: string, cvc: string, titular: string): void {
    this.reservasService.procesarPagoConTarjeta(idreserva, saldopendiente, montoPago, numeroTarjeta, fechaExpiracion, cvc, titular).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Pago con tarjeta realizado',
          text: 'El pago con tarjeta fue realizado exitosamente.',
        });
        
        // Actualiza los campos de pago realizado y saldo pendiente
        this.cargarReservasCliente(response.reserva.codigocliente);
  
        if (montoPago < saldopendiente) {
          // Si el pago fue menor, habilitamos el botón de "Realizar pago final"
          this.mostrarBotonPagoFinal = true;
          this.mostrarBotonPagoInicial = false;
        } else {
          // Si el pago cubrió todo el saldo, cambiamos el estado a "Pagada"
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


    // evita error de typings


mostrarPayPal(reserva: any) {
  // 1) Desplegamos el contenedor
  
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
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'paypal'
        },
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
                // ① Ya actualizaste la reserva en BD. Ahora:
                // — 1) recargar la lista de reservas del cliente:
                this.cargarReservasCliente(reserva.codigocliente);

                // — 2) construir el objeto de “pago pendiente”:
                const clienteStorage: any = JSON.parse(localStorage.getItem('identity_user') || '{}');
                const nombreCliente = clienteStorage.nombre || 'Cliente desconocido';

                // — 3) levantar (o crear) el arreglo en localStorage['pagosPendientes']:
                const pagosJSON = localStorage.getItem('pagosPendientes') || '[]';
                const pagosPendientes: Array<any> = JSON.parse(pagosJSON);

                // — 4) agregar este nuevo pago:
                pagosPendientes.push({
                  reservaId: reserva.idreserva,
                  clienteNombre: nombreCliente,
                  tipoPago: tipo === 'inicial' ? 'Primer pago' : 'Segundo pago',
                  fecha: new Date().toISOString()
                });

                // — 5) guardar de nuevo en localStorage:
                localStorage.setItem('pagosPendientes', JSON.stringify(pagosPendientes));

                // — 6) disparar el evento custom para notificar al AdminComponent:
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
  // 1) Recuperas el nombre y código del cliente
  const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
  const nombre = user.nombre || 'Cliente';
  const codigocliente = user.codigocliente;

  // 2) Muestras tu alerta genérica
  Swal.fire({
    icon: 'warning',
    title: `Estimado/a ${nombre}`,
    text: `Por políticas internas de la empresa, le informamos que al solicitar la cancelación de su reserva, perderá cualquier abono económico realizado anteriormente. ¿Deseas continuar con la cancelación de tu reserva?`,
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'No'
  }).then(result => {
    if (result.isConfirmed) {
      // 3a) Si el usuario acepta: envías la solicitud y dejas que enviarSolicitudCancelacion muestre el modal de éxito y notifique al admin
      this.enviarSolicitudCancelacion(reserva.idreserva, codigocliente);
    } else {
      // 3b) Si cancela: lo devuelves al listado
      this.router.navigate(['/inicioCliente']);
    }
  });
}


// Extraigo el envío + modal de éxito en un método para no repetir
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








