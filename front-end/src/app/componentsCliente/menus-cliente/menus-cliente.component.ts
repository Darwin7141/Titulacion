import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenusService } from '../../services/menus.service';

@Component({
  selector: 'app-menus-cliente',
  standalone: false,
  
  templateUrl: './menus-cliente.component.html',
  styleUrl: './menus-cliente.component.css'
})
export class MenusClienteComponent implements OnInit {
  idServicioParam: string | null = null;
  
  menusFiltrados: any[] = [];
  mensajeSinMenus: string = '';

  // Para el modal
  menuSeleccionado: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private menusService: MenusService
  ) {}

  ngOnInit(): void {
    // 1) Leer el :idservicio de la ruta
    this.idServicioParam = this.route.snapshot.paramMap.get('idservicio');

    // 2) Cargar menús y filtrar por idservicio
    this.obtenerMenusDelServicio();
  }

  obtenerMenusDelServicio(): void {
    if (!this.idServicioParam) {
      // si por alguna razón no llega id, podrías mostrar un mensaje o redirigir
      this.mensajeSinMenus = 'No se recibió id de servicio.';
      return;
    }

    // Descargamos todos los menús
    this.menusService.getMenu().subscribe({
      next: (dataMenus) => {
        // Añadir URL de imagen
        const todosLosMenus = dataMenus.map((m: any) => {
          const fotografiaUrl = `http://localhost:8010/api/getMenu/${m.imagen}/true`;
          return { ...m, fotografiaUrl };
        });
        // Filtrar por idservicio
        this.menusFiltrados = todosLosMenus.filter(
          (mn) => mn.idservicio === this.idServicioParam
        );

        if (this.menusFiltrados.length === 0) {
          this.mensajeSinMenus = 'Por el momento no existen menús en este servicio.';
        } else {
          this.mensajeSinMenus = '';
        }
      },
      error: (err) => {
        console.error('Error al obtener menús:', err);
        this.mensajeSinMenus = 'Ocurrió un error al obtener los menús.';
      },
    });
  }

  // Al hacer clic en una tarjeta => modal
  verDetalleMenu(menu: any): void {
    this.menuSeleccionado = menu;
  }

  // Cerrar modal
  cerrarDetalleMenu(): void {
    this.menuSeleccionado = null;
  }

  // Lógica "Reservar"
  reservarMenu(): void {
    console.log('Reservando menú:', this.menuSeleccionado);
    // Podrías redirigir a /reservas, o abrir otra pantalla, etc.
  }
}
