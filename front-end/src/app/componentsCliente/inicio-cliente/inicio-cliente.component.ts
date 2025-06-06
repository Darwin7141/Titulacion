import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotificacionesService, NotifData } from '../../services/notificaciones.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inicio-cliente',
  standalone: false,
  
  templateUrl: './inicio-cliente.component.html',
  styleUrl: './inicio-cliente.component.css'
})
export class InicioClienteComponent implements OnInit, OnDestroy{

  userEmail: string = '';
  hayNuevasNotificaciones: boolean = false;     // true si hay al menos una notificación
  cantidadNotificacionesCliente: number = 0; 
   notificaciones: Array<{ texto: string; idreserva: string; fecha: string }> = [];

   private codigocliente: string | null = null;

   private subscripciones: any[] = [];

   


  constructor(
    private _auth:AuthService,
    private _router:Router,
    private notiSvc: NotificacionesService,
  
    private _ngZone: NgZone){}

    
    logout(){
      
      this._auth.logOut();
      
      this._router.navigate(['login']);

    }

    ngOnInit() {

      const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
    if (user && user.correo) {
      this.userEmail = user.correo;
    } else {
      this.userEmail = 'Invitado';
    }

    this.codigocliente = user?.codigocliente || null;
    // Aquí podrías realizar una comprobación de nuevas notificaciones
    // Esto es solo un ejemplo de cómo podrías manejar las notificaciones
    const subCambioEstado = this.notiSvc.onCambioEstado().subscribe((data: NotifData | null) => {
      if (!data) return;
      // Filtrar sólo las notificaciones que correspondan a ESTE cliente
      if (data.codigocliente === this.codigocliente) {
        this._ngZone.run(() => {
          this.notificaciones.push({
            texto: data.mensaje,
            idreserva: data.idreserva,
            fecha: data.timestamp
          });
          this.hayNuevasNotificaciones = this.notificaciones.length > 0;
          this.cantidadNotificacionesCliente = this.notificaciones.length;
        });
      }
    });
    this.subscripciones.push(subCambioEstado);

    // 2) Opcionalmente, suscribirse a pagos si el cliente también debe verlo
    const subNuevoPago = this.notiSvc.onNuevoPago().subscribe((data: NotifData | null) => {
      if (!data) return;
      if (data.codigocliente === this.codigocliente) {
        this._ngZone.run(() => {
          this.notificaciones.push({
            texto: data.mensaje,      // data.mensaje puede contener “Pago realizado…”
            idreserva: data.idreserva,
            fecha: data.timestamp
          });
          this.hayNuevasNotificaciones = this.notificaciones.length > 0;
          this.cantidadNotificacionesCliente = this.notificaciones.length;
        });
      }
    });
    this.subscripciones.push(subNuevoPago);

    // 3) Y, si quisieras recibir también notificaciones del “pago final”:
    const subPagoFinal = this.notiSvc.onNuevoPagoFinal().subscribe((data: NotifData | null) => {
      if (!data) return;
      if (data.codigocliente === this.codigocliente) {
        this._ngZone.run(() => {
          this.notificaciones.push({
            texto: data.mensaje,
            idreserva: data.idreserva,
            fecha: data.timestamp
          });
          this.hayNuevasNotificaciones = this.notificaciones.length > 0;
          this.cantidadNotificacionesCliente = this.notificaciones.length;
        });
      }
    });
    this.subscripciones.push(subPagoFinal);
  }

  ngOnDestroy() {
    // Limpiar todas las suscripciones
    this.subscripciones.forEach(s => {
      if (s && typeof s.unsubscribe === 'function') {
        s.unsubscribe();
      }
    });
    this.subscripciones = [];
  }
  verNotificacionesCliente() {
    if (this.notificaciones.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin notificaciones',
        text: 'No hay notificaciones nuevas.',
        confirmButtonText: 'Cerrar'
      });
      return;
    }
    let htmlContent = `<div style="text-align: left;"><ul style="padding-left:20px;">`;
    this.notificaciones.forEach(n => {
      htmlContent += `
        <li style="margin-bottom:8px;">
          <strong>${new Date(n.fecha).toLocaleString()}:</strong><br>
          ${n.texto}
        </li>
      `;
    });
    htmlContent += `</ul></div>`;

    Swal.fire({
      icon: 'info',
      title: 'Notificaciones',
      html: htmlContent,
      showConfirmButton: true,
      confirmButtonText: 'Marcar todas como leídas'
    }).then(() => {
      this.notificaciones = [];
      this.hayNuevasNotificaciones = false;
      this.cantidadNotificacionesCliente = 0;
    });
  }
}
  


