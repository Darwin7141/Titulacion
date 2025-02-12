import { Component, OnInit } from '@angular/core';
import { ReservasService } from '../../services/reservas.service';
import { Router } from '@angular/router';
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


  constructor(
    private reservasService: ReservasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
    const codigocliente = user?.codigocliente || null;

    if (codigocliente) {
      this.cargarReservasCliente(codigocliente);
    }

    
  }

  cargarReservasCliente(codigocliente: string): void {
    this.reservasService.getReservasByCliente(codigocliente).subscribe({
      next: (resp) => {
        this.reservas = resp;
  
        this.reservas.forEach(reserva => {
          // Verificar si el estado es Aceptada, sin importar los valores de pagorealizado y saldopendiente
          if (reserva.nombre.estado_reserva === 'Aceptada') {
            reserva.mostrarBotonPagoInicial = true;
            reserva.mostrarBotonPagoFinal = true;
          } else {
            reserva.mostrarBotonPagoInicial = false;
            reserva.mostrarBotonPagoFinal = false;
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener reservas del cliente:', err);
      }
    });
    
  }
  

  descargarComprobante(reserva: any) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    

    const clienteData = JSON.parse(localStorage.getItem('clienteReservaData') || '{}');
console.log(clienteData);

    // Verifica si se obtuvieron correctamente los datos del cliente
    if (!clienteData) {
      console.error('No se encontraron los datos del cliente');
      return;
    }
  
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("COMPROBANTE DE PAGO", (pageWidth - doc.getTextWidth("COMPROBANTE DE PAGO")) / 2, 20);
  
    // Obtener la fecha actual
    const fechaActual = new Date().toLocaleDateString(); // Formato: MM/DD/YYYY
  
    // Información del cliente (usando los datos de cliente obtenidos)
    doc.setFontSize(12);
    doc.text(`Fecha: ${fechaActual}`, 10, 30);
    doc.text(`Nombre: ${clienteData.nombre || 'No disponible'}`, 10, 35); // Usamos clienteData.nombre
    doc.text(`Cédula: ${clienteData.ci || 'No disponible'}`, 10, 40);      // Usamos clienteData.ci
    doc.text(`Dirección: ${clienteData.direccion || 'No disponible'}`, 10, 45); // Usamos clienteData.direccion
    doc.text(`Teléfono: ${clienteData.telefono || 'No disponible'}`, 10, 50);   // Usamos clienteData.telefono
  
    // Títulos de la tabla
    let yPos = 60;
    doc.text("MENÚ", 10, yPos);
    doc.text("CANTIDAD", 60, yPos);
    doc.text("PRECIO UNIT.", 110, yPos);
    doc.text("SUBTOTAL", 160, yPos);
  
    // Líneas de la tabla
    doc.line(10, yPos + 2, pageWidth - 10, yPos + 2);
    yPos += 10;
  
    // Detalles de la reserva
    reserva.detalles.forEach((item: any) => {
      doc.text(item.menu.nombre, 10, yPos);
      doc.text(item.cantpersonas.toString(), 60, yPos);
      doc.text(`$${item.preciounitario.toFixed(2)}`, 110, yPos);
      doc.text(`$${item.subtotal.toFixed(2)}`, 160, yPos);
      yPos += 10;
    });
  
    // Línea inferior de la tabla
    doc.line(10, yPos, pageWidth - 10, yPos);
  
    // Total general
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total: $${reserva.total.toFixed(2)}`, 160, yPos);
  
    // Generar y descargar el PDF
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
  
}

