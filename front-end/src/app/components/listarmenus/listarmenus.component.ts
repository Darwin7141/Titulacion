import { Component, OnInit } from '@angular/core';
import { MenusService } from '../../services/menus.service';
import { TipocateringService } from '../../services/tipocatering.service';


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

  constructor(
    private menuService: MenusService,
    private tipoCatering: TipocateringService
  ) {}

  ngOnInit(): void {
    this.tipoCatering.getTipo().subscribe({
      next: (data) => {
        this.tipo = data; // Asigna los cargos a la lista
      },
      error: (err) => {
        console.error('Error al obtener cargos:', err);
      },
    });
   
    this.obtenerMenus();
    this.cargarLista();
  }

  obtenerMenus(): void {
    this.menuService.getMenu().subscribe({
      next: (data) => {
        this.menu = data;
        this.menuFiltrados = data;
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
      this.menuService.editarMenu(this.menuSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.menuSeleccionado = null;
          this.obtenerMenus();
        },
        error: (err) => {
          console.error('Error al actualizar el menu:', err);
        },
      });
    }
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
        this.menu = data;
        this.menuFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener los menús:', err);
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }
}
