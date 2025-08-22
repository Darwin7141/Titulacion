import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotificacionesService, NotifData } from '../../services/notificaciones.service';
import Swal from 'sweetalert2';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { MenusClienteComponent } from '../menus-cliente/menus-cliente.component';
import { tap } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';


interface ClienteNoti {
  id: number;              
  texto: string;
  idreserva: string;
  fecha: string;
}

interface SlideServicio {
  url:  string;
  nombre: string;
  descripcion: string;
}

type VistaCliente = 'dashboard' | 'servicios' | 'generar' | 'reservas'|'menus';

@Component({
  selector: 'app-inicio-cliente',
  standalone: false,
  templateUrl: './inicio-cliente.component.html',
  styleUrl: './inicio-cliente.component.css',
  animations: [
    trigger('slideToggle', [
      state('true',  style({ height: '*',  opacity: 1, overflow: 'hidden' })),
      state('false', style({ height: '0',  opacity: 0, overflow: 'hidden' })),
      transition('true <=> false', animate('250ms ease-in-out'))
    ])
  ]
})
export class InicioClienteComponent implements OnInit, OnDestroy {

  userEmail = '';
  hayNuevasNotificaciones = false;
  cantidadNotificacionesCliente = 0;
  notificaciones: ClienteNoti[] = [];
  urls : string[] = [];
  hover = false; 
  slides: SlideServicio[] = [];
  currentSlide = 0;
  auto$?: any; 

  private codigocliente: string | null = null;
  private subscripciones: any[] = [];

  activeView: VistaCliente = 'dashboard';

  showServicios = false;
  serviciosSidebar: Array<{ idservicio:string; nombre:string }> = [];
  selectedServicioId: string | null = null;
  selectedServicioNombre = '';

  setView(view: VistaCliente): void {
    this.activeView = view;
  }

  constructor(
    private _auth: AuthService,
    private _router: Router,
    private notiSvc: NotificacionesService,
    private _ngZone: NgZone,
    private servCat : ServiciocateringService
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
    this.cargarImagenesServicios();
    this.cargarServiciosSidebar(); 
    
  }

  ngOnDestroy() {
    this.subscripciones.forEach(s => s.unsubscribe && s.unsubscribe());
    this.subscripciones = [];
    clearInterval(this.auto$);
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

  private cargarImagenesServicios(): void {
  this.servCat.getServicio()
    .pipe(
      tap(lista => {
        this.slides = lista.map((s: any) => ({
          url : `http://localhost:8010/api/getfotografia/${s.imagen}/false`,
          nombre: s.nombre,                       // o el campo que uses
          descripcion: s.descripcion ?? ''        // idem
        }));
      })
    )
    .subscribe({
      next : () => this.iniciarAutoSlide(),
      error: err => console.error('No se pudieron cargar imágenes', err)
    });
}

prev() { this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length; }
next() { this.currentSlide = (this.currentSlide + 1) % this.slides.length; }

/* autoplay cada 7 s */
private iniciarAutoSlide() {
  this.auto$?.unsubscribe?.();
  this.auto$ = setInterval(() => this.next(), 7000);
}

private cargarServiciosSidebar(): void {
  this.servCat.getServicio().subscribe({
    next: (lista:any[]) => {
      this.serviciosSidebar = lista.map(s => ({
        idservicio: String(s.idservicio),   // ← guarda como string
        nombre: s.nombre
      }));
    },
    error: err => console.error('No se pudo cargar servicios para el lateral', err)
  });
}

  // ── NUEVO: al elegir un servicio del submenú
seleccionarServicio(s: {idservicio:string; nombre:string}) {
  this.selectedServicioId = s.idservicio;     // ← string
  this.selectedServicioNombre = s.nombre;
  this.activeView = 'menus';
}

onIrAReserva(): void {
  this.activeView = 'generar';  // abre Agendar reserva
}

}
