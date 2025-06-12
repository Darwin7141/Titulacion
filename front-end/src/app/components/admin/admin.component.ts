

import { Component, OnInit, OnDestroy, NgZone} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { AfterViewInit } from '@angular/core';
import { ReservasService } from '../../services/reservas.service'; 
import Swal from 'sweetalert2';
import { NotificacionesService, NotifData } from '../../services/notificaciones.service';
import { forkJoin } from 'rxjs';

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
  cancelaciones:   string[]   = [];

  expiraciones: string[] = [];

  private subscripciones: Array<any> = [];

  constructor(
    private _auth:AuthService,
    private reservasService: ReservasService,
    private _router:Router,
    private _ngZone: NgZone,
     private notiSvc: NotificacionesService,

    ){}

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
           <!-- Títulos centrados -->
         <div style="text-align:center; margin-bottom:16px;">
           
           <h4 style="margin:4px 0 0;">Detalles de la Reserva ${reservaId}</h4>
         </div>
         <!-- Campos alineados a la izquierda -->
         <div style="text-align:left; line-height:1.6; margin-bottom:16px;">
           <p style="margin:4px 0;"><strong>Fecha del evento:</strong> ${new Date(reserva.fechaevento).toLocaleDateString()}</p>
           <p style="margin:4px 0;"><strong>Dirección del evento:</strong> ${reserva.direccionevento}</p>
           <p style="margin:4px 0;"><strong>Total:</strong> $${reserva.total.toFixed(2)}</p>
           <p style="margin:4px 0;"><strong>Primer pago:</strong> $${(reserva.primer_pago ?? 0).toFixed(2)}</p>
           <p style="margin:4px 0;"><strong>Segundo pago:</strong> $${(reserva.segundo_pago ?? 0).toFixed(2)}</p>
           <p style="margin:4px 0;"><strong>Saldo pendiente:</strong> $${(reserva.saldo_pendiente ?? 0).toFixed(2)}</p>
         </div>
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

  // 3) Me suscribo a ambos eventos (almacenamiento local y custom)
  window.addEventListener('storage', this.onStorageEvent);
  window.addEventListener('nuevasReservasActualizado', this.onCustomEvent);
  window.addEventListener('nuevosPagosActualizado', this.onCustomEvent);

 const sub1 = this.notiSvc.onNuevaReserva().subscribe((data: NotifData | null) => {
      if (!data) return;
      this._ngZone.run(() => {
        const idres = data.idreserva;
        if (idres && !this.reservasNuevas.includes(idres)) {
          this.reservasNuevas.push(idres);
          localStorage.setItem('nuevasReservas', JSON.stringify(this.reservasNuevas));
        }
      });
    });
    this.subscripciones.push(sub1);

    // ————————————— SUSCRIPCIÓN A “NUEVO PAGO” —————————————
    const sub2 = this.notiSvc.onNuevoPago().subscribe((data: NotifData | null) => {
      if (!data) return;
      this._ngZone.run(() => {
        const pago = { 
          reservaId:    data.idreserva, 
          clienteNombre: data.clienteNombre || 'Desconocido',       // Rellenar con lo que venga en data.mensaje o data.clienteNombre 
          tipoPago:      data.tipoPago || 'Pago', 
          fecha:         data.timestamp
        };
        // Evitamos duplicados exactos:
        const yaExiste = this.pagosPendientes.some(
          p => p.reservaId === pago.reservaId && p.tipoPago === pago.tipoPago
        );
        if (!yaExiste) {
          this.pagosPendientes.push(pago);
          localStorage.setItem('pagosPendientes', JSON.stringify(this.pagosPendientes));
        }
      });
    });
    this.subscripciones.push(sub2);

    // ————————————— SUSCRIPCIÓN A “NUEVO PAGO FINAL” (opcional) —————————————
    const sub3 = this.notiSvc.onNuevoPagoFinal().subscribe((data: NotifData | null) => {
      if (!data) return;
      this._ngZone.run(() => {
        const pago = {
          reservaId:     data.idreserva,
          clienteNombre: data.clienteNombre || 'Desconocido',       // data.clienteNombre si viene
          tipoPago:      data.tipoPago || 'Pago Final',
          fecha:         data.timestamp
        };
        const yaExiste = this.pagosPendientes.some(
          p => p.reservaId === pago.reservaId && p.tipoPago === pago.tipoPago
        );
        if (!yaExiste) {
          this.pagosPendientes.push(pago);
          localStorage.setItem('pagosPendientes', JSON.stringify(this.pagosPendientes));
        }
      });
    });
    this.subscripciones.push(sub3);

    // ————————————— SUSCRIPCIÓN A “CAMBIO DE ESTADO” (opcional) —————————————
    const sub4 = this.notiSvc.onCambioEstado().subscribe((data: NotifData | null) => {
      if (!data) return;
      this._ngZone.run(() => {
        // data.nuevoEstado, data.idreserva, data.mensaje, data.timestamp
        // Podés enviarlo, por ejemplo, a reservasNuevas o a un array aparte:
        const texto = data.mensaje;
        const idres = data.idreserva;
        
        if (idres && !this.reservasNuevas.includes(idres)) {
          this.reservasNuevas.push(idres);
          localStorage.setItem('nuevasReservas', JSON.stringify(this.reservasNuevas));
        }
      });
    });
    this.subscripciones.push(sub4);

  // 5) Defino la función global que llama al modal de pago
  (window as any).verPago = (reservaId: string) => {
    this._ngZone.run(() => {
      this.abrirModalPago(reservaId);
    });
  };

   this.notiSvc.getCancelacionesAdmin().subscribe(list => {
    this.cancelaciones = list.map(c => c.mensaje);
  });

  this.notiSvc.getExpiracionesAdmin().subscribe(list => {
    this.expiraciones = list.map(e => e.mensaje);
  });

  // 2) suscripción al WebSocket para nuevas cancelaciones
  const subCancel = this.notiSvc.onNuevaNotificacion().subscribe(noti => {
    if (noti) {
      this._ngZone.run(() => {
        this.cancelaciones.push(noti.mensaje);
      });
    }
  });
  this.subscripciones.push(subCancel);

  const subExp = this.notiSvc.onNuevaNotificacion()
    .subscribe(noti => {
      if (noti && noti.mensaje.startsWith('El producto') /* solo expiraciones */) {
        this._ngZone.run(() => {
          this.expiraciones.push(noti.mensaje);
        });
      }
    });
  this.subscripciones.push(subExp);
}

  ngOnDestroy() {
  // Importante: quitar listeners al destruir el componente
  window.removeEventListener('storage', this.onStorageEvent);
  window.removeEventListener('nuevasReservasActualizado', this.onCustomEvent);
  window.removeEventListener('nuevosPagosActualizado', this.onCustomEvent);

  // 7) Cancelar la(s) suscripción(es) a notificaciones WebSocket
  this.subscripciones.forEach(sub => {
    if (sub && typeof sub.unsubscribe === 'function') {
      sub.unsubscribe();
    }
  });
  this.subscripciones = [];
}

  get hayNotificaciones(): boolean {
  return (
    this.reservasNuevas.length +
    this.pagosPendientes.length +
    this.cancelaciones.length +
    this.expiraciones.length 
  ) > 0;
}
  get cantidadNotificaciones(): number {
  return (
    this.reservasNuevas.length +
    this.pagosPendientes.length +
    this.cancelaciones.length +
    this.expiraciones.length
  );
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

 

  let htmlContent = `<ul style="text-align: left; margin-left: 20px;">`;

  // a) Reservas nuevas
  if (this.reservasNuevas.length > 0) {
    htmlContent += `<p style="font-weight: bold; margin:0 0 8px;">Reservas nuevas</p>`;
    htmlContent += `<ul style="list-style: disc; padding-left:20px; margin:0 0 12px;">`;
    this.reservasNuevas.forEach(id => {
      htmlContent += `
         <li style="display:flex; align-items:center; margin-bottom:8px;">
           <span style="flex:1; color:#000;">
             Se ha generado una nueva reserva con código: ${id}
           </span>
           <button
             onclick="window.selectReserva('${id}')"
             style="white-space:nowrap; background:#007bff; color:#fff; border:none; border-radius:4px; padding:6px 12px; margin-left:8px; cursor:pointer;"
           >
             Ver
           </button>
         </li>`;
      });

      htmlContent += `</ul>`;
  }

  if (this.cancelaciones.length) {
    htmlContent += `<p><strong>Solicitudes de cancelación</strong></p><ul>`;
    this.cancelaciones.forEach(msg => {
      htmlContent += `<li>${msg}</li>`;   // aquí sale **solo** el mensaje puro
    });
    htmlContent += `</ul>`;
  }

  if (this.expiraciones.length) {
    htmlContent += `<p style="font-weight:bold;margin:12px 0 8px;">Productos a punto de expirar</p><ul>`;
    this.expiraciones.forEach(msg => {
      htmlContent += `<li>${msg}</li>`;
    });
    htmlContent += `</ul>`;
  }

  // b) Pagos pendientes
  if (this.pagosPendientes.length > 0) {
   htmlContent += `<p style="font-weight: bold; margin:12px 0 8px;">Pagos realizados</p>`;
     htmlContent += `<ul style="list-style: disc; padding-left:20px; margin:0 0 12px;">`;
    this.pagosPendientes.forEach(p => {
      const tipo = p.tipoPago.toLowerCase().replace(/_/g, ' ');  
  htmlContent += `
    <li style="display:flex;align-items:center;margin-bottom:8px;">
      <span style="flex:1;color:#000;">
        El cliente ${p.clienteNombre} ha realizado el ${tipo} de la reserva ${p.reservaId}
      </span>
      <button
        onclick="window.verPago('${p.reservaId}','${p.tipoPago}')"
        style="margin-left:8px;white-space:nowrap;background:#007bff;color:white;border:none;
               border-radius:4px;padding:6px 12px;cursor:pointer;"
      >Ver</button>
    </li>
  `;
    });
     htmlContent += `</ul>`;
  }

  htmlContent += `</ul>`;

  // Defino las funciones globales antes de mostrar el modal
  (window as any).selectReserva = (idReserva: string) => {
    this.irAListaReservas(idReserva);
  };
  (window as any).verPago = (idreserva: string, tipoPago: string) => {
  this.irAPagoPendiente(idreserva, tipoPago);
};

  Swal.fire({
    icon: 'info',
    title: 'Notificaciones',
    html: htmlContent,
    showCloseButton: true,      // muestra la “X”
    focusConfirm: false,
    confirmButtonText: 'Marcar todas como vistas'
  })
  .then(result => {
    if (result.isConfirmed) {
      forkJoin({
        cancel: this.notiSvc.markAllCancelacionesAdminAsRead(),
        exp:    this.notiSvc.markAllExpiracionesAdminAsRead()
      }).subscribe({
        next: () => {
          // limpio UI
          this.reservasNuevas  = [];
          this.pagosPendientes = [];
          this.cancelaciones   = [];
          this.expiraciones    = [];
          localStorage.removeItem('nuevasReservas');
          localStorage.removeItem('pagosPendientes');
          window.dispatchEvent(new Event('nuevasReservasActualizado'));
          window.dispatchEvent(new Event('nuevosPagosActualizado'));
        },
        error: err => console.error('No se pudo marcar notificaciones como leídas', err)
      });
    }
  });
  
}


// Este método sólo quita la reserva concreta y abre la vista de detalles
irAListaReservas(idreserva: string) {
  // 1) Cierro el modal (dispara Swal.then con result.isDismissed=true)
  Swal.close();

  // 2) Quito esa sola reserva del array:
  this.reservasNuevas = this.reservasNuevas.filter(r => r !== idreserva);
  // 3) Actualizo localStorage:
  localStorage.setItem('nuevasReservas', JSON.stringify(this.reservasNuevas));
  // 4) Informo al header (u otro componente) del cambio:
  window.dispatchEvent(new Event('nuevasReservasActualizado'));
  // 5) Navego a la lista de reservas:
  this._router.navigate(['/listaReservas'], { queryParams: { highlight: idreserva } });
}

irAPagoPendiente(reservaId: string, tipoPago: string) {
  // 1) cerrar el modal
  Swal.close();

  // 2) filtrar sólo el pago que NO coincide con reservaId + tipoPago
  this.pagosPendientes = this.pagosPendientes.filter(
    p => !(p.reservaId === reservaId && p.tipoPago === tipoPago)
  );

  // 3) actualizar localStorage
  localStorage.setItem('pagosPendientes', JSON.stringify(this.pagosPendientes));

  // 4) notificar a los listeners (header, badge…)
  window.dispatchEvent(new Event('nuevosPagosActualizado'));

  // 5) finalmente abrimos el modal de detalle (o navegamos)
  this._ngZone.run(() => this.abrirModalPago(reservaId));
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
  


