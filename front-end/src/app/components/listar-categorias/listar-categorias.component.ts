import { Component, OnInit} from '@angular/core';
import { CategoriaProductosService } from '../../services/categoria-productos.service';

@Component({
  selector: 'app-listar-categorias',
  standalone: false,
  
  templateUrl: './listar-categorias.component.html',
  styleUrl: './listar-categorias.component.css'
})
export class ListarCategoriasComponent implements OnInit {
  cat: any[] = [];
  catFiltrados: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  catSeleccionado: any = null;

  constructor(private categoriaService: CategoriaProductosService) {}

  ngOnInit(): void {
   
    this.obtenerCategorias();
    this.cargarLista();
  }

  obtenerCategorias(): void {
    this.categoriaService.getCategoria().subscribe({
      next: (data) => {
        this.cat = data;
        this.catFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener categorias', err);
      },
    });
  }

  buscarCategorias(): void {
    console.log('Término de búsqueda:', this.searchTerm);
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.catFiltrados = this.cat; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.catFiltrados = this.cat.filter((cat) =>
        cat.categoria.toLowerCase().includes(searchTermLower) ||
        cat.idcategoria.toString().includes(searchTermLower) // Filtra también por código
      );
    }
  }

  editarCategorias(categoria: any): void {
    this.isEditMode = true;
    this.catSeleccionado = { ...categoria }; // Copia para evitar modificar el original
  }

  guardarEdicion(): void {
    if (this.catSeleccionado) {
      this.categoriaService.editarCategoria(this.catSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.catSeleccionado = null;
          this.obtenerCategorias();
        },
        error: (err) => {
          console.error('Error al actualizar categorias:', err);
        },
      });
    }
  }
  

  eliminarCategorias(idcategoria: string): void {
    if (confirm('¿Está seguro de que desea eliminar esta categoria?')) {
      this.categoriaService.eliminarCategoria(idcategoria).subscribe({
        next: () => {
          this.obtenerCategorias();
        },
        error: (err) => {
          console.error('Error al eliminar la categoria:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.catSeleccionado = null;
  }
  cargarLista(): void {
    this.categoriaService.getCategoria().subscribe({
      next: (data) => {
        this.cat = data;
        this.catFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener categorias:', err);
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }
}

