
import { Component, OnInit, OnDestroy, NgZone} from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { AfterViewInit } from '@angular/core';
import { ReservasService } from '../../services/reservas.service'; 
import Swal from 'sweetalert2';
import { NotificacionesService, NotifData } from '../../services/notificaciones.service';
import { forkJoin } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ChartConfiguration } from 'chart.js';
import { ProductosService }      from '../../services/productos.service';
import { ClientesService }       from '../../services/clientes.service';
import { ProveedoresService }    from '../../services/proveedores.service';

@Component({
  selector: 'app-admin',
  standalone: false,
  
  
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'] ,
  
  animations: [
    trigger('slideToggle', [
      state('true', style({ height: '*', opacity: 1, overflow: 'hidden' })),
      state('false', style({ height: '0px', opacity: 0, overflow: 'hidden' })),
      transition('true <=> false', animate('300ms ease-in-out'))
    ])
  ]
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

  totalStock       = 0;
  totalClientes    = 0;
  totalProveedores = 0;

  // ───────── Gráfico reservas 6 meses ─────────
  reservasLabels: string[] = [];         // ej. ['Ene', 'Feb', …]
  reservasData  : number[] = [];         // totales por mes

  // ───────── Servicios más reservados ─────────
  topServicios: { nombre: string, total: number }[] = [];
  activeView: 'dashboard' | 'admin' | 'cliente' | 'cargos' |
            'empleados' | 'proveedores' |
            'prod-general' | 'prod-cat' | 'tipos' 
            | 'servicios' | 'menus' | 'reservas'= 'dashboard';

  selectedCatId: number | null = null;
  

  constructor(
    private _auth:AuthService,
    private reservasService: ReservasService,
    private _router:Router,
    private _ngZone: NgZone,
     private notiSvc: NotificacionesService,
       private productosSvc:   ProductosService,
    private clientesSvc:    ClientesService,
    private proveedoresSvc: ProveedoresService,
    private reservasSvc:    ReservasService,

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
     this.cargarTarjetas();
    this.cargarGraficoReservas();
    this.cargarTopServicios();
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
      width: 480,
      html: `
        
        <h2 class="swal-pro-title">Sin novedades</h2>
        <p class="swal-pro-desc">No hay reservas, pagos ni alertas nuevas.</p>
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

  let html = `
    
    <h2 class="swal-pro-title">Notificaciones</h2>
  `;

  // Reservas nuevas
  if (this.reservasNuevas.length) {
    html += `<p class="swal-pro-section">Reservas nuevas</p><ul class="swal-pro-list">`;
    this.reservasNuevas.forEach(id => {
      html += `
        <li>
          <span>Se ha generado una nueva reserva con código: <strong>${id}</strong></span>
          <button class="swal-pro-see" onclick="window.selectReserva('${id}')">Ver</button>
        </li>`;
    });
    html += `</ul>`;
  }

  // Pagos realizados
  if (this.pagosPendientes.length) {
    html += `<p class="swal-pro-section">Pagos realizados</p><ul class="swal-pro-list">`;
    this.pagosPendientes.forEach(p => {
      const tipo = (p.tipoPago || 'pago').toLowerCase().replace(/_/g,' ');
      html += `
        <li>
          <span>El cliente <strong>${p.clienteNombre}</strong> ha realizado el ${tipo} de la reserva <strong>${p.reservaId}</strong></span>
          <button class="swal-pro-see" onclick="window.verPago('${p.reservaId}','${p.tipoPago}')">Ver</button>
        </li>`;
    });
    html += `</ul>`;
  }

  // Cancelaciones
  if (this.cancelaciones.length) {
    html += `<p class="swal-pro-section">Solicitudes de cancelación</p><ul class="swal-pro-list">`;
    this.cancelaciones.forEach(m => html += `<li><span>${m}</span></li>`);
    html += `</ul>`;
  }

  // Expiraciones
  if (this.expiraciones.length) {
    html += `<p class="swal-pro-section">Productos a punto de expirar</p><ul class="swal-pro-list">`;
    this.expiraciones.forEach(m => html += `<li><span>${m}</span></li>`);
    html += `</ul>`;
  }

  // funciones globales usadas por los botones "Ver"
  (window as any).selectReserva = (id: string) => this.irAListaReservas(id);
  (window as any).verPago = (id: string, tipo: string) => this.irAPagoPendiente(id, tipo);

  Swal.fire({
    width: 520,
    html,
    showCloseButton: true,
    focusConfirm: false,
    confirmButtonText: 'Marcar todas como vistas',
    buttonsStyling: false,
    customClass: {
      popup: 'swal-pro',
      confirmButton: 'swal-pro-confirm',
      htmlContainer: 'swal-pro-html'
    }
  }).then(result => {
    if (result.isConfirmed) {
      forkJoin({
        cancel: this.notiSvc.markAllCancelacionesAdminAsRead(),
        exp:    this.notiSvc.markAllExpiracionesAdminAsRead()
      }).subscribe({
        next: () => {
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

     private cargarTarjetas() {
    this.productosSvc.getProducto().subscribe(p => this.totalStock       = p
      .reduce((acc: number, prod: any) => acc + (prod.stock ?? 0), 0));

    this.clientesSvc.getClientes().subscribe(c  => this.totalClientes    = c.length);
    this.proveedoresSvc.getProveedor().subscribe(p => this.totalProveedores = p.length);
  }

  // ——— 2) gráfico reservas últimos 6 meses ———
  private cargarGraficoReservas() {
  const mesesTxt = ['Ene','Feb','Mar','Abr','May','Jun',
                    'Jul','Ago','Sep','Oct','Nov','Dic'];

  this.reservasSvc.getReservasUltimosSeisMeses()
      .subscribe(resp => {

        /* resp = [{ mes:'YYYY-MM', total:'5' }, … ]  */
        const mapa = new Map(
          resp.map(r => [ r.mes, Number(r.total) ])   // → Map<YYYY-MM, nº>
        );

        const labels : string[] = [];
        const values : number[] = [];

        const hoy = new Date();               // mes actual
        for (let i = 5; i >= 0; i--) {
          const d   = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
          const key = d.toISOString().slice(0,7);   // 'YYYY-MM'

          labels.push( mesesTxt[d.getMonth()] );
          values.push( mapa.get(key) ?? 0 );        // 0 si no hay datos
        }

        this.reservasLabels = labels;
        this.reservasData   = values;
      });
}
  // ——— 3) servicios más reservados ——————————
private cargarTopServicios() {
    this.reservasSvc.getServiciosMasReservados().subscribe(lista => {
      // esperamos algo como [{ nombre:'Buffet', total:89 }, …]
      this.topServicios = lista.slice(0,5);   // top-5
    });
  }

  // ——— Configuración Chart.js (getter) ————————
  get chartData() {
  return {
    labels: this.reservasLabels,
    datasets: [{
      data: this.reservasData,
      label: 'Reservas',
      tension: .4,
      fill: 'origin',
      borderWidth: 2
    }]
  };
}

chartOptions: ChartConfiguration<'line'>['options'] = {
  responsive: true,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color:'#eee' } },
    x: { grid: { display:false } }
  }
};


setView(view: typeof this.activeView, catId?: number): void {
  this.activeView   = view;
  this.selectedCatId = catId ?? null;
}
}
    
  
  


