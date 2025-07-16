import { Component , OnInit, Output, EventEmitter } from '@angular/core';
import { ProveedoresService } from '../../services/proveedores.service';
import { PageEvent } from '@angular/material/paginator'; 
import { MatDialog } from '@angular/material/dialog';
import { ProveedoresComponent } from '../proveedores/proveedores.component';

@Component({
  selector: 'app-listarproveedor',
  standalone: false,
  
  templateUrl: './listarproveedor.component.html',
  styleUrl: './listarproveedor.component.css'
})
export class ListarproveedorComponent implements OnInit {
  prov: any[] = [];
  provFiltrados: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  provSeleccionado: any = null;
  displayedProveedores: any[] = [];
  pageSize = 3;
  pageIndex = 0;

  @Output() cerrar = new EventEmitter<void>();

  
  volver(): void {
    this.cerrar.emit();
  }

  constructor(private adminService: ProveedoresService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
   
    this.obtenerProv();
    this.cargarLista();
  }

  obtenerProv(): void {
    this.adminService.getProveedor().subscribe({
      next: (data) => {
        this.prov = data;
        this.provFiltrados = data;
        this.updatePagedData();
      },
      error: (err) => {
        console.error('Error al obtener proveedores:', err);
      },
    });
  }

  buscarProv(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.provFiltrados = this.prov; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.provFiltrados = this.prov.filter((prov) =>
        prov.nombre.toLowerCase().includes(searchTermLower) ||
        prov.ci.toLowerCase().includes(searchTermLower) // Filtra también por código
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
    this.displayedProveedores = this.provFiltrados.slice(start, end);
  }
 

  guardarEdicion(): void {
    if (this.provSeleccionado) {
      this.adminService.editarProveedor(this.provSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.provSeleccionado = null;
          this.obtenerProv();
        },
        error: (err) => {
          console.error('Error al actualizar proveedor:', err);
        },
      });
    }
  }

  eliminarProv(codigoadmin: string): void {
    if (confirm('¿Está seguro de que desea eliminar este proveedor?')) {
      this.adminService.eliminarProveedor(codigoadmin).subscribe({
        next: () => {
          this.obtenerProv();
        },
        error: (err) => {
          console.error('Error al eliminar prov:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.provSeleccionado = null;
  }
  cargarLista(): void {
    this.adminService.getProveedor().subscribe({
      next: (data) => {
        this.prov = data;
        this.provFiltrados = data;
        this.pageIndex = 0;                 // resetea a la 1.ª página
    this.updatePagedData();
      },
      error: (err) => {
        console.error('Error al obtener proveedor:', err);
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }

  abrirDialogoAgregar(): void {
      const dialogRef = this.dialog.open(ProveedoresComponent, {
        width: '600px',          // o el ancho que prefieras
         disableClose: true,
      autoFocus: false  
      }).afterClosed().subscribe(flag => {
          if (flag) this.obtenerProv();   // ← refresca con 'saved' o el que envíes
        });
      }
      
        editarProv(prov: any): void {
        this.dialog.open(ProveedoresComponent, {
          width: '600px',
          disableClose: true,
          autoFocus: false,
          data: { prov }                 
        }).afterClosed().subscribe(flag => {
          if (flag) this.obtenerProv();   
        });
      }
}
