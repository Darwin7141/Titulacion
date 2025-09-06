import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CategoriaProductosService } from '../../services/categoria-productos.service';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { CategoriaProductosComponent } from '../categoria-productos/categoria-productos.component';

@Component({
  selector: 'app-listar-categorias',
  standalone: false,
  templateUrl: './listar-categorias.component.html',
  styleUrl: './listar-categorias.component.css'
})
export class ListarCategoriasComponent implements OnInit {

  cat: any[] = [];
  catFiltrados: any[] = [];
  displayedCats: any[] = [];

  searchTerm = '';
  pageSize = 10;
  pageIndex = 0;

  @Output() cerrar = new EventEmitter<void>();
  volver(){ this.cerrar.emit(); }

  constructor(
    private categoriaService: CategoriaProductosService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.obtenerCategorias();
    this.cargarLista();
  }

  private updatePagedData(): void {
    const start = this.pageIndex * this.pageSize;
    const end   = start + this.pageSize;
    this.displayedCats = this.catFiltrados.slice(start, end);
  }

  obtenerCategorias(): void {
    this.categoriaService.getCategoria().subscribe({
      next: data => {
        this.cat = data;
        this.catFiltrados = data;
        this.pageIndex = 0;
        this.updatePagedData();
      },
      error: err => console.error('Error al obtener categorías', err)
    });
  }

  buscarCategorias(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.catFiltrados = term
      ? this.cat.filter(c =>
          c.categoria.toLowerCase().includes(term) ||
          String(c.idcategoria).toLowerCase().includes(term))
      : this.cat;

    this.pageIndex = 0;
    this.updatePagedData();
  }

  pageChanged(ev: PageEvent): void {
    this.pageIndex = ev.pageIndex;
    this.pageSize  = ev.pageSize;
    this.updatePagedData();
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.obtenerCategorias();
  }

  abrirDialogoAgregar(): void {
    this.dialog.open(CategoriaProductosComponent, {
      width: '600px', disableClose: true, autoFocus: false
    }).afterClosed().subscribe(flag => {
      if (flag) this.obtenerCategorias();
    });
  }

  editarCategorias(cat: any): void {
    this.dialog.open(CategoriaProductosComponent, {
      width: '600px', disableClose: true, autoFocus: false,
      data: { categoria: cat }
    }).afterClosed().subscribe(flag => {
      if (flag) this.obtenerCategorias();
    });
  }

  eliminarCategorias(idcategoria: string): void {
    if (!confirm('¿Está seguro de eliminar esta categoría?')) return;
    this.categoriaService.eliminarCategoria(idcategoria).subscribe({
      next: () => {
      this.obtenerCategorias(),
      window.dispatchEvent(new Event('categoriasActualizadas'))},

      error: err => console.error('Error al eliminar la categoría', err)
    });
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
}




