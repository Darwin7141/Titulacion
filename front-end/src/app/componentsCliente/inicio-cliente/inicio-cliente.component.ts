import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotificacionesService, NotifData } from '../../services/notificaciones.service';
import Swal from 'sweetalert2';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { MenusClienteComponent } from '../menus-cliente/menus-cliente.component';
import { tap } from 'rxjs/operators';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { environment } from '../../../environments/environment';


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
  sidenavWidth = 40;

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

  private CLAVE_LS_BASE = 'notificaciones_cliente_pendientes';

private claveCache(): string {
  return `${this.CLAVE_LS_BASE}_${this.codigocliente}`;
}

private cargarCacheNotificaciones(): ClienteNoti[] {
  try {
    const crudo = localStorage.getItem(this.claveCache());
    return crudo ? JSON.parse(crudo) as ClienteNoti[] : [];
  } catch {
    return [];
  }
}

private guardarCacheNotificaciones(lista: ClienteNoti[]) {
  localStorage.setItem(this.claveCache(), JSON.stringify(lista));
}


private fusionarPorId(listaA: ClienteNoti[], listaB: ClienteNoti[]): ClienteNoti[] {
  const porId = new Map<number, ClienteNoti>();
  [...listaA, ...listaB].forEach(n => porId.set(n.id, n));
  return Array.from(porId.values())
    .sort((x, y) => new Date(y.fecha).getTime() - new Date(x.fecha).getTime());
}


  ngOnInit() {

    const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
    this.userEmail = user?.correo ?? 'Invitado';
    this.codigocliente = user?.codigocliente || null;

    if (this.codigocliente) {
    this.notiSvc.identifyCliente(this.codigocliente);
  }

  const cacheInicial = this.cargarCacheNotificaciones();
  this.notificaciones = cacheInicial;
  this.hayNuevasNotificaciones = cacheInicial.length > 0;
  this.cantidadNotificacionesCliente = cacheInicial.length;

  if (this.codigocliente) {
    this.notiSvc.fetchNotificacionesCliente(this.codigocliente)
      .subscribe(nuevasDesdeApi => {
        const notisApi: ClienteNoti[] = (nuevasDesdeApi as any[]).map(n => ({
          id:        n.id,
          texto:     n.mensaje,
          idreserva: n.idreserva,
          fecha:     n.creado_en
        }));

        const fusionadas = this.fusionarPorId(this.notificaciones, notisApi);

        this._ngZone.run(() => {
          this.notificaciones = fusionadas;
          this.hayNuevasNotificaciones = fusionadas.length > 0;
          this.cantidadNotificacionesCliente = fusionadas.length;
          this.guardarCacheNotificaciones(fusionadas);
        });
      });
  }

  // 5) Socket: nueva notificación en vivo (mensaje ya “listo para mostrar”)
  const subNuevaNotificacion = this.notiSvc.onNuevaNotificacion()
    .subscribe(datos => {
      if (!datos) return;

      const notificacionNueva: ClienteNoti = {
        id:        datos.id,
        texto:     datos.mensaje,
        idreserva: (datos as any).idreserva ?? '',
        fecha:     datos.timestamp
      };

      const fusionadas = this.fusionarPorId([notificacionNueva], this.notificaciones);

      this._ngZone.run(() => {
        this.notificaciones = fusionadas;
        this.hayNuevasNotificaciones = true;
        this.cantidadNotificacionesCliente = fusionadas.length;
        this.guardarCacheNotificaciones(fusionadas);
      });
    });
  this.subscripciones.push(subNuevaNotificacion);

  
  const subCambioEstado = this.notiSvc.onCambioEstado()
    .subscribe((datos: NotifData & { id?: number } | null) => {
      if (!datos || datos.codigocliente !== this.codigocliente) return;

      const notificacionEstado: ClienteNoti = {
        id:        datos.id!,
        texto:     datos.mensaje,
        idreserva: datos.idreserva!,
        fecha:     datos.timestamp
      };

      const fusionadas = this.fusionarPorId([notificacionEstado], this.notificaciones);

      this._ngZone.run(() => {
        this.notificaciones = fusionadas;
        this.hayNuevasNotificaciones = true;
        this.cantidadNotificacionesCliente = fusionadas.length;
        this.guardarCacheNotificaciones(fusionadas);
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
  // Mismo patrón que el admin: modal “Sin novedades”
  if (!this.notificaciones.length) {
    Swal.fire({
      width: 480,
      html: `
        <h2 class="swal-pro-title">Sin novedades</h2>
        <p class="swal-pro-desc">No hay notificaciones nuevas.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Listo',
      buttonsStyling: false,
      customClass: {
        popup: 'swal-pro',
        confirmButton: 'swal-pro-confirm',
        htmlContainer: 'swal-pro-html'
      }
    });
    return;
  }

  const ordenadas = [...this.notificaciones].sort((a, b) => {
    const ta = new Date(a.fecha).getTime();
    const tb = new Date(b.fecha).getTime();
    return tb - ta; // desc
  });

  
  let html = `
    <h2 class="swal-pro-title">Notificaciones</h2>
    <ul class="swal-pro-list">
  `;

  ordenadas.forEach(n => {
    const fecha = new Date(n.fecha).toLocaleString();
    html += `
      <li>
        <span>
          <small style="display:block;color:#6b7280;margin-bottom:2px">${fecha}</small>
          ${n.texto}
        </span>
        <button class="swal-pro-see js-ver-visto" data-id="${n.id}">Visto</button>
      </li>
    `;
  });

  html += `</ul>`;

  // función global para el botón "Visto"
  (window as any).marcarVistoCliente = (notifId: number) => {
    this._ngZone.run(() => this.marcarVisto(notifId));
  };

  Swal.fire({
    width: 520,
    html,
    showCloseButton: true,
    focusConfirm: false,
    confirmButtonText: 'Marcar todas como leídas',
    buttonsStyling: false,
    customClass: {
      popup: 'swal-pro swal-pro--cliente',
      confirmButton: 'swal-pro-confirm',
      htmlContainer: 'swal-pro-html swal-pro-html--cliente' 
    },
    didOpen: (popup) => {
  const botones = popup.querySelectorAll('.js-ver-visto'); // NodeListOf<Element>
  botones.forEach((btn) => {
    btn.addEventListener('click', () => {
      const idStr = (btn as Element).getAttribute('data-id'); // ✔
      if (!idStr) return;
      const id = Number(idStr);
      this._ngZone.run(() => this.marcarVisto(id));
    });
  });
},
  }).then(result => {
    if (result.isConfirmed && this.codigocliente) {
      this.notiSvc.marcarTodasComoLeidas(this.codigocliente).subscribe(() => {
        this.notificaciones = [];
        this.hayNuevasNotificaciones = false;
        this.cantidadNotificacionesCliente = 0;
        this.guardarCacheNotificaciones([]);
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
      this.guardarCacheNotificaciones(this.notificaciones);
      Swal.close();
      if (this.notificaciones.length) {
        this.verNotificacionesCliente();
      }
    });
  }

 private cargarImagenesServicios(): void {
  this.servCat.getServicio()
    .subscribe({
      next: (lista: any[]) => {
        // Solo items con imagen; si quieres incluir los que no tienen, quita el filter
        this.slides = (lista || [])
          .filter(s => !!s?.imagen)
          .map((s: any) => ({
            url: this.servCat.getFotoUrl(s.imagen, false),  // prueba con true (thumb). Si 404, usa false.
            nombre: s.nombre ?? '',
            descripcion: s.descripcion ?? ''
          }));

        // (opcional) log para depurar rutas
        this.slides.forEach(sl => console.log('[IMG]', sl.url));

        this.iniciarAutoSlide();
      },
      error: err => console.error('No se pudieron cargar imágenes:', err)
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
