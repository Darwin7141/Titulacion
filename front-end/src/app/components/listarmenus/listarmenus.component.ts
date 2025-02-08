import { Component, OnInit } from '@angular/core';
import { MenusService } from '../../services/menus.service';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-listarmenus',
  standalone: false,
  
  templateUrl: './listarmenus.component.html',
  styleUrl: './listarmenus.component.css'
})
export class ListarmenusComponent implements OnInit {
  menu: any[] = [];
  menuFiltrados: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  menuSeleccionado: any = null;
  tipo: any[] = [];
  isLoading: boolean = false;

  idServicioParam: string | null = null;

  constructor(
    private menuService: MenusService,
    private servCatering: ServiciocateringService,
    private route: ActivatedRoute  
  ) {}

  ngOnInit(): void {
    // 1) Leer el parámetro :idservicio, si existe
    this.idServicioParam = this.route.snapshot.paramMap.get('idservicio');

    // 2) Obtener la lista de servicios (para el mat-select) 
    this.servCatering.getServicio().subscribe({
      next: (data) => {
        this.tipo = data; // Asigna los cargos a la lista
      },
      error: (err) => {
        console.error('Error al obtener los servicios:', err);
      },
    });

    // 3) Obtener todos los menús
    this.obtenerMenus();

    // 4) Cargar lista (parece que tu código llama 2 veces; si no es necesario, podrías quitarlo)
    
  }


  obtenerMenus(): void {
    this.menuService.getMenu().subscribe({
      next: (data) => {
        // Transformamos cada menú para que tenga 'fotografiaUrl'
        this.menu = data.map(menu => {
          const fotografiaUrl = `http://localhost:8010/api/getMenu/${menu.imagen}/true`;
          return { ...menu, fotografiaUrl };
        });

        // *** FILTRAR si existe un idServicioParam
        if (this.idServicioParam) {
          // Filtra localmente por idservicio
          this.menuFiltrados = this.menu.filter(
            (m) => m.idservicio === this.idServicioParam
          );

          // Si no hay menús para ese servicio, podrías mostrar un mensaje, 
          // o simplemente dejar la tabla vacía
          if (this.menuFiltrados.length === 0) {
            console.log('No hay menús para el servicio:', this.idServicioParam);
          }
        } else {
          // Si no hay param, mostramos todos
          this.menuFiltrados = this.menu;
        }
      },
      error: (err) => {
        console.error('Error al obtener los menus:', err);
      },
    });
  }

  buscarMenus(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.menuFiltrados = this.menu; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.menuFiltrados = this.menu.filter((menu) =>
        menu.nombre.toLowerCase().includes(searchTermLower) ||
        menu.idmenu.toLowerCase().includes(searchTermLower) // Filtra también por código
      );
    }
  }

  editarMenus(menu: any): void {
    this.isEditMode = true;
    this.menuSeleccionado = { ...menu }; // Copia para evitar modificar el original
  }

  guardarEdicion(): void {
    if (this.menuSeleccionado) {
      const idmenu = this.menuSeleccionado.idmenu;

      // Activar spinner
      this.isLoading = true;

      // Si el usuario seleccionó una nueva imagen
      if (this.nuevaImagen) {
        this.menuService.subirImagenServicio(this.nuevaImagen, idmenu)
          .subscribe({
            next: (res) => {
              this.menuSeleccionado.imagen = res.fotografia.imagen;
              // Ahora actualizamos los demás campos del servicio
              this.actualizarServicio();
            },
            error: (err) => {
              this.isLoading = false; // desactivar spinner en caso de error
              console.error('Error al subir imagen:', err);
            }
          });
      } else {
        // Si no hay imagen nueva, actualizamos directamente
        this.actualizarServicio();
      }
    }
  }

  private actualizarServicio(): void {
    this.menuService.editarMenu(this.menuSeleccionado).subscribe({
      next: () => {
        // Al terminar la actualización, ocultar spinner
        this.isLoading = false;
        this.isEditMode = false;
        this.menuSeleccionado = null;
        this.nuevaImagen = null;
        this.obtenerMenus();
      },
      error: (err) => {
        this.isLoading = false; // desactivar spinner en caso de error
        console.error('Error al actualizar el servicio:', err);
      },
    });
  }

  eliminarMenus(idmenu: string): void {
    if (confirm('¿Está seguro de que desea eliminar este servicio?')) {
      this.menuService.eliminarMenu(idmenu).subscribe({
        next: () => {
          this.obtenerMenus();
        },
        error: (err) => {
          console.error('Error al eliminar el menú:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.menuSeleccionado = null;
  }
  cargarLista(): void {
    this.menuService.getMenu().subscribe({
      next: (data) => {
        this.menu = data.map(menu => {
          const fotografiaUrl = `http://localhost:8010/api/getMenu/${menu.imagen}/true`;
          return { ...menu, fotografiaUrl };
        });
        this.menuFiltrados = this.menu;
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }

  nuevaImagen: File | null = null;

  onNewImageSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.nuevaImagen = event.target.files[0];
      console.log('Nueva imagen seleccionada:', this.nuevaImagen);
      // Aquí podrías generar una vista previa, etc.
    }
  }
}
