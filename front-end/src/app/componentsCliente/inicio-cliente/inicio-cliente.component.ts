import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotificacionesService, NotifData } from '../../services/notificaciones.service';
import Swal from 'sweetalert2';


interface ClienteNoti {
  id: number;              
  texto: string;
  idreserva: string;
  fecha: string;
}

@Component({
  selector: 'app-inicio-cliente',
  standalone: false,
  templateUrl: './inicio-cliente.component.html',
  styleUrl: './inicio-cliente.component.css'
})
export class InicioClienteComponent implements OnInit, OnDestroy {

  userEmail = '';
  hayNuevasNotificaciones = false;
  cantidadNotificacionesCliente = 0;
  notificaciones: ClienteNoti[] = [];

  private codigocliente: string | null = null;
  private subscripciones: any[] = [];

  constructor(
    private _auth: AuthService,
    private _router: Router,
    private notiSvc: NotificacionesService,
    private _ngZone: NgZone
  ) {}

  logout() {
    this._auth.logOut();
    this._router.navigate(['login']);
  }

  ngOnInit() {
    const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
    this.userEmail = user?.correo ?? 'Invitado';
    this.codigocliente = user?.codigocliente || null;

    // 1) FETCH INICIAL de notificaciones “offline”
    if (this.codigocliente) {
      this.notiSvc.fetchNotificacionesCliente(this.codigocliente)
        .subscribe(initial => {
          const formatted: ClienteNoti[] = initial.map(d => ({
            id:             (d as any).id,
            texto:          d.mensaje,               // ← uso directo de mensaje desde la BD
            idreserva:      d.idreserva,
            fecha:          (d as any).creado_en     // ← uso de la fecha real en creado_en
          }));
          this._ngZone.run(() => {
            this.notificaciones = formatted;
            this.hayNuevasNotificaciones = formatted.length > 0;
            this.cantidadNotificacionesCliente = formatted.length;
          });
        });
    }

    // 2) Suscripción a cambios de estado en tiempo real
    const subCambioEstado = this.notiSvc.onCambioEstado()
  .subscribe((data: NotifData & { id?: number } | null) => {
    if (!data || data.codigocliente !== this.codigocliente) return;
    // ya que la noti viene con mensaje correcto, no hace falta reconstruirlo:
    const textoNoti = data.mensaje;
    this._ngZone.run(() => {
      this.notificaciones.push({
        id: data.id!,                 // ← usamos el id real
        texto: textoNoti,
        idreserva: data.idreserva!,
        fecha: data.timestamp
      });
      this.hayNuevasNotificaciones = this.notificaciones.length > 0;
      this.cantidadNotificacionesCliente = this.notificaciones.length;
    });
  });
    this.subscripciones.push(subCambioEstado);
  }

  ngOnDestroy() {
    this.subscripciones.forEach(s => s.unsubscribe && s.unsubscribe());
    this.subscripciones = [];
  }

  /** Botón “campanita” */
  verNotificacionesCliente(): void {
    if (!this.notificaciones.length) {
      Swal.fire({
        icon: 'info',
        title: 'Sin notificaciones',
        text: 'No hay notificaciones nuevas.',
        confirmButtonText: 'Cerrar'
      });
      return;
    }

    let html = `<div style="text-align:left;">`;
    this.notificaciones.forEach(n => {
      html += `
        <div style="
           display: flex;
           align-items: flex-start;
           margin-bottom: 16px;
           padding-bottom: 16px;
           border-bottom: 1px solid #eee;
        ">
          <div style="flex: 1;">
            <div style="font-size:0.875rem; color:#555; margin-bottom:4px;">
              ${new Date(n.fecha).toLocaleString()}
            </div>
            <div style="color:#222;">
              ${n.texto}
            </div>
          </div>
          <button
            onclick="window.marcarVistoCliente(${n.id}); return false;"
            style="
              margin-left: auto;
              background-color: #007bff;
              color: #fff;
              border: none;
              border-radius: 4px;
              padding: 6px 12px;
              cursor: pointer;
            "
          >
            Visto
          </button>
        </div>
      `;
    });
    html += `</div>`;

    (window as any).marcarVistoCliente = (notifId: number) => {
      this._ngZone.run(() => this.marcarVisto(notifId));
    };

    Swal.fire({
      icon: 'info',
      title: 'Notificaciones',
      html,
      showCloseButton: true,
      focusConfirm: false,
      confirmButtonText: 'Marcar todas como leídas'
    }).then(result => {
      if (result.isConfirmed && this.codigocliente) {
        this.notiSvc.marcarTodasComoLeidas(this.codigocliente)
          .subscribe(() => {
            this.notificaciones = [];
            this.hayNuevasNotificaciones = false;
            this.cantidadNotificacionesCliente = 0;
          });
      }
    });
  }

  /** Marcar individual como leída */
  private marcarVisto(id: number) {
    this.notiSvc.marcarComoLeida(id).subscribe(() => {
      this.notificaciones = this.notificaciones.filter(n => n.id !== id);
      this.hayNuevasNotificaciones = this.notificaciones.length > 0;
      this.cantidadNotificacionesCliente = this.notificaciones.length;
      Swal.close();
      if (this.notificaciones.length) {
        this.verNotificacionesCliente();
      }
    });
  }
}
