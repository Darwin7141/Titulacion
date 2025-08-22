import { Component, OnInit, OnChanges, Input, SimpleChanges,Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenusService } from '../../services/menus.service';
import { SeleccionMenusService } from '../../services/seleccion-menus.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menus-cliente',
  standalone: false,
  templateUrl: './menus-cliente.component.html',
  styleUrl: './menus-cliente.component.css'
})
export class MenusClienteComponent implements OnInit, OnChanges {

  /** id de servicio (string) y nombre (opcional) recibidos del padre o por ruta */
  @Input() idServicio?: string;
  @Input() nombreServicio?: string;
  
  @Output() cerrar = new EventEmitter<void>();
  @Output() irAReserva = new EventEmitter<void>();

  private servicioId: string | null = null;

  menusFiltrados: any[] = [];
  mensajeSinMenus = '';
  menuSeleccionado: any = null;
  IVA_PORC = 15;
  selectedQty = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private menusService: MenusService,
    private carrito: SeleccionMenusService  
  ) {}

  private normalizar(v: any): string {
    return (v == null ? '' : String(v)).trim().toLowerCase();
  }

  // Lee el id (Input tiene prioridad; si no, ruta)
  private resolverIdServicio(): string | null {
    if (this.idServicio != null) return String(this.idServicio);
    return (
      this.route.snapshot.paramMap.get('idservicio') ??
      this.route.snapshot.paramMap.get('id')
    );
  }

  ngOnInit(): void {
    if (this.idServicio == null) {
      this.servicioId = this.resolverIdServicio();
      this.obtenerMenusDelServicio();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('idServicio' in changes || 'nombreServicio' in changes) {
      this.servicioId = this.resolverIdServicio();
      this.obtenerMenusDelServicio();
    }
  }

  private obtenerMenusDelServicio(): void {
    const idNorm = this.normalizar(this.servicioId);
    const nombreNorm = this.normalizar(this.nombreServicio);

    if (!idNorm && !nombreNorm) {
      this.mensajeSinMenus = 'No se recibió id de servicio.';
      this.menusFiltrados = [];
      return;
    }

    this.mensajeSinMenus = '';
    this.menusService.getMenu().subscribe({
      next: (dataMenus) => {
        const todos = dataMenus.map((m: any) => ({
          ...m,
          fotografiaUrl: `http://localhost:8010/api/getMenu/${m.imagen}/true`,
          // posibles formas en las que llega el servicio desde la API
          _idservicio: this.normalizar(m.idservicio ?? m.servicio?.idservicio),
          _nombreServ: this.normalizar(m.servicio?.nombre ?? m.servicio ?? m.nombreServicio)
        }));

        // 1) intentamos por id
        let filtrados = todos.filter(mn => mn._idservicio && mn._idservicio === idNorm);

        // 2) si no hubo match por id y tenemos nombre, probamos por nombre
        if (!filtrados.length && nombreNorm) {
          filtrados = todos.filter(mn => mn._nombreServ && mn._nombreServ === nombreNorm);
        }

        this.menusFiltrados = filtrados;

        this.mensajeSinMenus = this.menusFiltrados.length
          ? ''
          : 'Por el momento no existen menús en este servicio.';
      },
      error: (err) => {
        console.error('Error al obtener menús:', err);
        this.mensajeSinMenus = 'Ocurrió un error al obtener los menús.';
        this.menusFiltrados = [];
      },
    });
  }

  volver(): void {
    this.cerrar.emit();
  }

  verDetalleMenu(menu: any): void { 
  this.menuSeleccionado = menu;
  this.selectedQty = 1; 
   }
  cerrarDetalleMenu(): void { 
  this.menuSeleccionado = null; 
}

 decQty() { this.selectedQty = Math.max(1, this.selectedQty - 1); }
 incQty() { this.selectedQty = Math.min(999, this.selectedQty + 1); }

 reservarMenu(): void { console.log('Reservando menú:', this.menuSeleccionado); }

 descripcionItems(raw?: string): string[] {
  if (!raw) return [];

  let text = raw
    .replace(/<br\s*\/?>/gi, '\n')                // <br> a saltos
    .replace(/\r/g, '')                           
    .replace(/^\s*ingredientes?:?\s*/i, '')       
    .trim();

  // Inserta salto antes de bullets tipo -, •, –, — (con o SIN espacio después)
  // Solo si están al inicio o tras un espacio (no "1-2 porciones")
  text = text.replace(/(?:^|\s)[\-•–—](?=\s|\d|\w)/g, '\n- ');

  // También trata ; o · como posibles separadores
  text = text.replace(/[;·]+/g, '\n- ');

  return text
    .split(/\n+/)                                 // divide por saltos
    .map(s => s.replace(/^\s*[-•–—]\s*/, '').trim())
    .filter(Boolean);
}

  agregarALista(menu: any): void {
  this.carrito.add(menu, this.selectedQty);

  // Evitar inyección en el HTML del modal
  const nombre = String(menu?.nombre ?? '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  Swal.fire({
    width: 480,
    // Usamos HTML propio para controlar la maquetación
    html: `
      <div class="swal-pro-check"></div>
      <h2 class="swal-pro-title">Añadido</h2>

      <p class="swal-pro-desc">Se agregó "<strong>${nombre}</strong>" a la reserva</p>
    `,
    showConfirmButton: true,
    confirmButtonText: 'Listo',
    showCancelButton: false,
    buttonsStyling: false,            // << nos permite estilizar el botón
    focusConfirm: true,
    customClass: {
      popup: 'swal-pro',
      confirmButton: 'swal-pro-confirm',
      htmlContainer: 'swal-pro-html'
    }
  });
}

  irAReservaClick(): void { this.irAReserva.emit(); }
}



