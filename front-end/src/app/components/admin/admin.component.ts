import { Component, OnInit, OnDestroy, NgZone} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { AfterViewInit } from '@angular/core';
import { ReservasService } from '../../services/reservas.service'; 
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin',
  standalone: false,
  
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit, OnDestroy{

  showGestionUsuarios = false;
  showProductos = false;
  showCatering = false;
  userEmail: string = '';
  hayNuevasReservas = false;
  reservasNuevas: string[] = [];
  pagosPendientes: Array<{ reservaId: string; clienteNombre: string; tipoPago: string; fecha: string }> = [];


  constructor(
    private _auth:AuthService,
    private reservasService: ReservasService,
    private _router:Router,
    private _ngZone: NgZone){}

  private onStorageEvent = (event: StorageEvent) => {
    this._ngZone.run(() => {
      if (event.key === 'nuevasReservas') {
        const arr = localStorage.getItem('nuevasReservas');
        this.reservasNuevas = arr ? JSON.parse(arr) : [];
      }
      if (event.key === 'pagosPendientes') {
        const pagosJSON = localStorage.getItem('pagosPendientes');
        this.pagosPendientes = pagosJSON ? JSON.parse(pagosJSON) : [];
      }
    });
  };

  // 2) Listener para nuestro evento custom (cuando la misma pestaña hace dispatchEvent)
  private onCustomEvent = () => {
    this._ngZone.run(() => {
      const arr = localStorage.getItem('nuevasReservas');
      this.reservasNuevas = arr ? JSON.parse(arr) : [];

      const pagosJSON = localStorage.getItem('pagosPendientes');
      this.pagosPendientes = pagosJSON ? JSON.parse(pagosJSON) : [];
    });
  };

  
    logout(){
      this._auth.logOut();
      this._router.navigate(['login']);

    }


    private abrirModalPago(reservaId: string): void {
    // 1) Consultamos la reserva completa desde el backend
    this.reservasService.getReservaById(reservaId).subscribe({
      next: (reserva) => {
        // reserva es el objeto que incluye { idreserva, fechaevento, direccionevento, total, primer_pago, segundo_pago, saldo_pendiente, detalles: [...] }
        // 2) Armamos contenido HTML para el modal
        let htmlPago = `
          <h3>Detalles de la Reserva ${reservaId}</h3>
          <p><strong>Fecha del evento:</strong> ${new Date(reserva.fechaevento).toLocaleDateString()}</p>
          <p><strong>Dirección del evento:</strong> ${reserva.direccionevento}</p>
          <p><strong>Total:</strong> $${reserva.total.toFixed(2)}</p>
          <p><strong>Primer pago:</strong> $${(reserva.primer_pago ?? 0).toFixed(2)}</p>
          <p><strong>Segundo pago:</strong> $${(reserva.segundo_pago ?? 0).toFixed(2)}</p>
          <p><strong>Saldo pendiente:</strong> $${(reserva.saldo_pendiente ?? 0).toFixed(2)}</p>
          <hr/>
          <p><strong>Menús contratados:</strong></p>
          <table style="width:100%; text-align:left; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="border-bottom:1px solid #ddd; padding: 4px;">Menú</th>
                <th style="border-bottom:1px solid #ddd; padding: 4px;">Cantidad</th>
                <th style="border-bottom:1px solid #ddd; padding: 4px;">Precio Unit.</th>
                <th style="border-bottom:1px solid #ddd; padding: 4px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
        `;

        reserva.detalles.forEach((item: any) => {
          htmlPago += `
            <tr>
              <td style="padding:4px;">${item.menu.nombre}</td>
              <td style="padding:4px;">${item.cantpersonas}</td>
              <td style="padding:4px;">$${item.preciounitario.toFixed(2)}</td>
              <td style="padding:4px;">$${item.subtotal.toFixed(2)}</td>
            </tr>
          `;
        });

        htmlPago += `
            </tbody>
          </table>
        `;

        // 3) Mostrar el modal con SweetAlert2
        Swal.fire({
          title: `Reserva ${reservaId}`,
          html: htmlPago,
          width: '600px',
          showCloseButton: true,
          focusConfirm: false,
          confirmButtonText: 'Cerrar'
        });
      },
      error: (err) => {
        console.error('No se pudo obtener datos de la reserva', err);
        Swal.fire('Error', 'No pudimos cargar los detalles de la reserva.', 'error');
      }
    });
  }

   ngOnInit() {
    // 1) Leo el usuario (si hay) o dejo ‘Invitado’
    const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
    this.userEmail = user?.correo || 'Invitado';

    // 2) Leo el arreglo inicial de nuevasReservas, por si ya existe
    const arr = localStorage.getItem('nuevasReservas');
    console.log('ngOnInit > nuevasReservas desde localStorage =', arr);
    this.reservasNuevas = arr ? JSON.parse(arr) : [];

    const pagosJSON = localStorage.getItem('pagosPendientes');
    this.pagosPendientes = pagosJSON ? JSON.parse(pagosJSON) : [];

    // 3) Me suscribo a ambos eventos
    window.addEventListener('storage', this.onStorageEvent);
    window.addEventListener('nuevasReservasActualizado', this.onCustomEvent);

    window.addEventListener('nuevasReservasActualizado', this.onCustomEvent);

    (window as any).verPago = (reservaId: string) => {
    // Forzamos que Angular sepa que está ocurriendo un evento externo:
    this._ngZone.run(() => {
      this.abrirModalPago(reservaId);
    });
  };
  }

  ngOnDestroy() {
    // Importante: quitar listeners al destruir el componente
    window.removeEventListener('storage', this.onStorageEvent);
    window.removeEventListener('nuevasReservasActualizado', this.onCustomEvent);
    window.removeEventListener('nuevosPagosActualizado', this.onCustomEvent);
  }

  get hayNotificaciones(): boolean {
    return this.reservasNuevas.length + this.pagosPendientes.length > 0;
  }
  get cantidadNotificaciones(): number {
    return this.reservasNuevas.length + this.pagosPendientes.length;
  }

  verNotificaciones() {
    if (!this.hayNotificaciones) {
      Swal.fire({
        icon: 'info',
        title: 'Sin novedades',
        text: 'No hay reservas ni pagos nuevos.'
      });
      return;
    }

    // — Construyo una lista combinada en el HTML del modal —
    let htmlContent = `<p><strong>Notificaciones recientes:</strong></p><ul style="text-align: left; margin-left: 20px;">`;

    // a) Primero las reservas nuevas (solo ID de reserva)
    if (this.reservasNuevas.length > 0) {
      htmlContent += `<li><u>Reservas nuevas:</u></li>`;
      this.reservasNuevas.forEach(id => {
        htmlContent += `
          <li style="cursor: pointer; color: blue; margin-left: 10px;"
              onclick="window.selectReserva('${id}')">
            Reserva: <strong>${id}</strong>
          </li>
        `;
      });
    }

    // b) Luego los pagos pendientes
    if (this.pagosPendientes.length > 0) {
      htmlContent += `<li style="margin-top: 8px;"><u>Pagos realizados:</u></li>`;
      this.pagosPendientes.forEach(pago => {
        htmlContent += `
        <li style="margin-left: 10px; margin-bottom: 6px;">
          El cliente “<strong>${pago.clienteNombre}</strong>” ha realizado el <strong>${pago.tipoPago}</strong> 
          de la reserva <em>${pago.reservaId}</em>
          &nbsp;
          <button
            onclick="window.verPago('${pago.reservaId}')"
            style="
              background-color: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
              padding: 2px 6px;
              font-size: 0.8rem;
              cursor: pointer;
            "
          >
            Ver
          </button>
        </li>
      `;
    });
  }

  htmlContent += `</ul>`;

    // — Función para seleccionar reserva (solo para clon) —
    (window as any).selectReserva = (idReserva: string) => {
      this.irAListaReservas(idReserva);
    };


    (window as any).verPago = (idReserva: string) => {
    this._ngZone.run(() => this.abrirModalPago(idReserva));
  };

    Swal.fire({
      icon: 'info',
      title: 'Notificaciones',
      html: htmlContent,
      showConfirmButton: true,
      confirmButtonText: 'Marcar todas como vistas'
    }).then(() => {
      // — Al cerrar el modal, marcamos TODO como “visto”:
      this.reservasNuevas = [];
      this.pagosPendientes = [];
      localStorage.removeItem('nuevasReservas');
      localStorage.removeItem('pagosPendientes');
    });
  }

  // — Al seleccionar una reserva abrimos “listaReservas” y la marcamos como vista —
  irAListaReservas(idreserva: string) {
    Swal.close();
    // Quitamos la reserva del arreglo (marcarla como “vista”):
    this.reservasNuevas = this.reservasNuevas.filter(r => r !== idreserva);
    localStorage.setItem('nuevasReservas', JSON.stringify(this.reservasNuevas));
    // Navegamos a la vista de lista de reservas para resaltarla
    this._router.navigate(['/listaReservas'], { queryParams: { highlight: idreserva } });
  }

    toggleGestionUsuarios() {
      this.showGestionUsuarios = !this.showGestionUsuarios;
    }
  
    toggleProductos() {
      this.showProductos = !this.showProductos;
    }
  
    toggleCatering() {
      this.showCatering = !this.showCatering;
    }
    
  }
  


