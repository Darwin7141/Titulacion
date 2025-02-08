import { Component, OnInit } from '@angular/core';
import { ProductosService } from '../../services/productos.service';
import { ProveedoresService } from '../../services/proveedores.service';
import { CategoriaProductosService } from '../../services/categoria-productos.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-listarproductos',
  
  templateUrl: './listarproductos.component.html',

  styleUrls: ['./listarproductos.component.css'],
  standalone: false,
})
export class ListarproductosComponent implements OnInit {
  productos: any[] = [];
  prodFiltrados: any[] = [];
  prov: any[] = [];
  cat: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  prodSeleccionado: any = null;
  idCatParam: string | null = null;

  constructor(
    private proveedorService: ProveedoresService,
    private productoService: ProductosService,
    private categoriaService: CategoriaProductosService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.idCatParam = this.route.snapshot.paramMap.get('idCategoria');

    // Cargar proveedores
    this.proveedorService.getProveedor().subscribe({
      next: (data) => {
        this.prov = data;
      },
      error: (err) => {
        console.error('Error al obtener proveedores:', err);
      },
    });

    // Cargar categorías
    this.categoriaService.getCategoria().subscribe({
      next: (data) => {
        this.cat = data;
      },
      error: (err) => {
        console.error('Error al obtener categorías:', err);
      },
    });

    // Cargar productos (filtrados o no)
    this.loadProducts();
  }

  // Método centralizado para filtrar o no según la categoría
  private loadProducts(): void {
    if (this.idCatParam) {
      this.productoService.getProductoByCategoria(this.idCatParam).subscribe({
        next: (data) => {
          this.productos = data;
          this.prodFiltrados = data;
        },
        error: (err) => {
          console.error('Error al obtener productos de la categoría:', err);
        },
      });
    } else {
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
  }

  buscarProducto(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase();
    if (searchTermLower === '') {
      this.prodFiltrados = this.productos;
    } else {
      this.prodFiltrados = this.productos.filter((producto) =>
        producto.nombre.toLowerCase().includes(searchTermLower) ||
        producto.idproducto.toLowerCase().includes(searchTermLower)
      );
    }
  }

  editarProducto(productos: any): void {
    this.isEditMode = true;
    this.prodSeleccionado = { ...productos };
  }

  guardarEdicion(): void {
    if (this.prodSeleccionado) {
      this.productoService.editarProducto(this.prodSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.prodSeleccionado = null;
          this.loadProducts(); // volver a cargar
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
          // Llamamos de nuevo a loadProducts para recargar la lista,
          // respetando si estamos en categoría o en la lista general
          this.loadProducts();
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
    this.loadProducts(); // recarga para mostrar la lista sin edición
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.loadProducts(); // recarga lista filtrada o general
  }
}

