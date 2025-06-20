import { Component, OnInit,  Output, EventEmitter } from '@angular/core';
import { AdministradorService } from '../../services/administrador.service';
import { PageEvent } from '@angular/material/paginator'; 

@Component({
  selector: 'app-listaadministrador',
  standalone: false,
  
  templateUrl: './listaadministrador.component.html',
  styleUrl: './listaadministrador.component.css'
})
export class ListaadministradorComponent implements OnInit {
  admin: any[] = [];
  adminFiltrados: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  adminSeleccionado: any = null;
  displayedAdmin: any[] = [];
  pageSize = 5;
  pageIndex = 0;

  @Output() cerrar = new EventEmitter<void>();

  
  volver(): void {
    this.cerrar.emit();
  }

  constructor(private adminService: AdministradorService) {}

  ngOnInit(): void {
   
    this.obtenerAdmin();
    this.cargarLista();
  }

  obtenerAdmin(): void {
    this.adminService.getAdministrador().subscribe({
      next: (data) => {
        this.admin = data;
        this.adminFiltrados = data;
        this.updatePagedData();
      },
      error: (err) => {
        console.error('Error al obtener empleados:', err);
      },
    });
  }

  buscarAdmin(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.adminFiltrados = this.admin; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.adminFiltrados = this.admin.filter((admin) =>
        admin.nombre.toLowerCase().includes(searchTermLower) ||
        admin.ci.toLowerCase().includes(searchTermLower) // Filtra también por código
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
    this.displayedAdmin = this.adminFiltrados.slice(start, end);
  }


  editarAdmin(admin: any): void {
    this.isEditMode = true;
    this.adminSeleccionado = { ...admin }; // Copia para evitar modificar el original
  }

  guardarEdicion(): void {
    if (this.adminSeleccionado) {
      this.adminService.editarAdmin(this.adminSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.adminSeleccionado = null;
          this.obtenerAdmin();
        },
        error: (err) => {
          console.error('Error al actualizar empleado:', err);
        },
      });
    }
  }

  eliminarAdmin(codigoadmin: string, ci: string): void {
    //if (ci === '0302687488') {
    //  alert('No se permite eliminar al administrador principal.');
    //  return;
  //  }
  
    if (confirm('¿Está seguro de que desea eliminar este administrador?')) {
      this.adminService.eliminarAdministrador(codigoadmin).subscribe({
        next: () => {
          this.obtenerAdmin();
        },
        error: (err) => {
          console.error('Error al eliminar administrador:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.adminSeleccionado = null;
  }
  cargarLista(): void {
    this.adminService.getAdministrador().subscribe({
      next: (data) => {
        this.admin = data;
        this.adminFiltrados = data;
        this.pageIndex = 0;          // ← vuelvo a la primera página
      this.updatePagedData(); 
      },
      error: (err) => {
        console.error('Error al obtener administradores:', err);
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }
}
