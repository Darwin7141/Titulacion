import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { MenusService } from '../../services/menus.service';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { ActivatedRoute } from '@angular/router';
import { PageEvent } from '@angular/material/paginator'; 
import { MatDialog } from '@angular/material/dialog';
import { MenusComponent } from '../menus/menus.component';


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

 displayedMenus: any[] = [];
  pageSize = 5;
  pageIndex = 0;

  @Output() cerrar = new EventEmitter<void>();
  volver(){ this.cerrar.emit(); }

  constructor(
    private menuService: MenusService,
    private servCatering: ServiciocateringService,
    private route: ActivatedRoute,
    private dialog: MatDialog
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


  /* === SOLO este método cambia === */
obtenerMenus(): void {
  this.menuService.getMenu().subscribe({
    next: (data) => {

      /* 1. map → añades fotografía */
      this.menu = data.map(menu => ({
        ...menu,
        fotografiaUrl: `http://localhost:8010/api/getMenu/${menu.imagen}/true`
      }));

      /* 2. filtras por servicio (si corresponde) */
      if (this.idServicioParam) {
        this.menuFiltrados = this.menu.filter(
          m => m.idservicio === this.idServicioParam
        );
      } else {
        this.menuFiltrados = this.menu;
      }

      /* 3. reinicias paginación y ACTUALIZAS la vista */
      this.pageIndex = 0;          // vuelve a la página 1
      this.updatePagedData();      // ← ¡¡ aquí estaba el “faltante” !!
    },
    error: err => console.error('Error al obtener menús:', err)
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
     this.pageIndex = 0;                 // resetea a la 1.ª página
    this.updatePagedData();
  }

  pageChanged(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;    // (sigue siendo 10)
    this.updatePagedData();
  }
  
  private updatePagedData(): void {
    const start = this.pageIndex * this.pageSize;
    const end   = start + this.pageSize;
    this.displayedMenus = this.menuFiltrados.slice(start, end);
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

      /* 1)  Actualiza el elemento en el array en memoria
             para que la plantilla cambie de inmediato   */
      const idx = this.menu.findIndex(
        m => m.idmenu === this.menuSeleccionado.idmenu
      );

      if (idx !== -1) {
        /*  ───── Si cambiaste la imagen, quizá quieras
            regenerar la URL; de lo contrario conserva la que ya
            estaba:                                           */
        const fotoUrl = this.menu[idx].fotografiaUrl;
        this.menu[idx] = { ...this.menuSeleccionado, fotografiaUrl: fotoUrl };
      }

      /* 2)  Reaplica búsqueda + paginación actuales          */
      this.buscarMenus();        //  ← ya llama a updatePagedData()

      /* 3)  Cierra el formulario y quita el spinner          */
      this.isLoading        = false;
      this.isEditMode       = false;
      this.menuSeleccionado = null;
      this.nuevaImagen      = null;

      /* 4)  (Opcional) refresco silencioso desde el servidor:
             descomenta si quieres sincronizar luego

      // this.obtenerMenus();
      */
    },
    error: err => {
      this.isLoading = false;
      console.error('Error al actualizar menú', err);
    }
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
         this.pageIndex = 0;                 // resetea a la 1.ª página
    this.updatePagedData();
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

  abrirDialogoAgregar(): void {
      const dialogRef = this.dialog.open(MenusComponent, {
        width: '600px',          // o el ancho que prefieras
         disableClose: true,
      autoFocus: false  
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'added') {   // se envía desde el diálogo
          this.obtenerMenus();      // refresca la tabla
        }
      });
    }
}
