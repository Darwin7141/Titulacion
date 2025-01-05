import { Component, OnInit } from '@angular/core';
import { ProductosService } from '../../services/productos.service';
import { ProveedoresService } from '../../services/proveedores.service';

@Component({
  selector: 'app-listarproductos',
  standalone: false,
  
  templateUrl: './listarproductos.component.html',
  styleUrl: './listarproductos.component.css'
})
export class ListarproductosComponent implements OnInit {
  productos: any[] =[];
  prodFiltrados: any[] = [];
  prov: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  prodSeleccionado: any = null;

  constructor(
    private proveedorService: ProveedoresService,
    private productoService: ProductosService
    ) {}

  ngOnInit(): void {
    this.proveedorService.getProveedor().subscribe({
      next: (data) => {
        this.prov = data; // Asigna los cargos a la lista
      },
      error: (err) => {
        console.error('Error al obtener los proveedores:', err);
      },
    });
    this.obtenerProducto();
    this.cargarLista();
  }

  obtenerProducto(): void {
    this.productoService.getProducto().subscribe({
      next: (data) => {
        this.productos= data;
        this.prodFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener los productos:', err);
      },
    });
  }

  buscarProducto(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.prodFiltrados = this.productos; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.prodFiltrados = this.productos.filter((producto) =>
        producto.nombre.toLowerCase().includes(searchTermLower) ||
        producto.idproducto.toLowerCase().includes(searchTermLower) // Filtra también por código
      );
    }
  }

  editarProducto(productos: any): void {
    this.isEditMode = true;
    this.prodSeleccionado = { ...productos }; // Copia para evitar modificar el original
  }

  guardarEdicion(): void {
    if (this.prodSeleccionado) {
      this.productoService.editarProducto(this.prodSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.prodSeleccionado = null;
          this.obtenerProducto();
        },
        error: (err) => {
          console.error('Error al actualizar producto:', err);
        },
      });
    }
  }

  eliminarProducto(idproducto: string): void {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
      this.productoService.eliminarProducto(idproducto).subscribe({
        next: () => {
          this.obtenerProducto();
        },
        error: (err) => {
          console.error('Error al eliminar producto:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.prodSeleccionado = null;
  }
  cargarLista(): void {
    this.productoService.getProducto().subscribe({
      next: (data) => {
        this.productos = data;
        this.prodFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener productos:', err);
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }
}
