import { Component , OnInit} from '@angular/core';
import { ProveedoresService } from '../../services/proveedores.service';

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

  constructor(private adminService: ProveedoresService) {}

  ngOnInit(): void {
   
    this.obtenerProv();
    this.cargarLista();
  }

  obtenerProv(): void {
    this.adminService.getProveedor().subscribe({
      next: (data) => {
        this.prov = data;
        this.provFiltrados = data;
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
  }

  editarProv(prov: any): void {
    this.isEditMode = true;
    this.provSeleccionado = { ...prov }; // Copia para evitar modificar el original
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
}
