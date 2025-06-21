import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { ProductosService }        from '../../services/productos.service';
import { ProveedoresService }      from '../../services/proveedores.service';
import { CategoriaProductosService } from '../../services/categoria-productos.service';

@Component({
  selector: 'app-listarproductos',
  templateUrl: './listarproductos.component.html',
  styleUrls: ['./listarproductos.component.css'],
  standalone: false
})
export class ListarproductosComponent implements OnInit {

  /* --------- propiedades --------- */
  productos:        any[] = [];
  prodFiltrados:    any[] = [];
  prov:             any[] = [];
  cat:              any[] = [];
  searchTerm        = '';
  isEditMode        = false;
  prodSeleccionado: any = null;

  /* id de categoría – puede llegar por @Input O por la URL */
  @Input() idCatParam: number | null = null;

  /* paginación */
  displayedProductos: any[] = [];
  pageSize            = 5;
  pageIndex           = 0;

  /* evento para volver al dashboard */
  @Output() cerrar = new EventEmitter<void>();
  volver(): void { this.cerrar.emit(); }

  /* --------- constructor --------- */
  constructor(
    private proveedorService:  ProveedoresService,
    private productoService:   ProductosService,
    private categoriaService:  CategoriaProductosService,
    private route:             ActivatedRoute
  ) {}

  /* --------- ciclo de vida --------- */
  ngOnInit(): void {

    /* 1) si el padre NO envió idCatParam, lo buscamos en la URL */
    if (this.idCatParam == null) {
      const idFromRoute = this.route.snapshot.paramMap.get('idCategoria');
      this.idCatParam   = idFromRoute ? Number(idFromRoute) : null;
    }

    /* 2) catálogos auxiliares */
    this.proveedorService.getProveedor().subscribe({
      next: data => (this.prov = data),
      error: err => console.error('Error al obtener proveedores:', err)
    });

    this.categoriaService.getCategoria().subscribe({
      next: data => (this.cat = data),
      error: err => console.error('Error al obtener categorías:', err)
    });

    /* 3) productos (general o filtrado) */
    this.loadProducts();
  }

  /* --------- carga de productos --------- */
  private loadProducts(): void {
    if (this.idCatParam) {
      this.productoService.getProductoByCategoria(this.idCatParam).subscribe({
        next: data => {
          this.productos     = data;
          this.prodFiltrados = data;
          this.pageIndex     = 0;
          this.updatePagedData();
        },
        error: err => console.error('Error al obtener productos por categoría:', err)
      });
    } else {
      this.productoService.getProducto().subscribe({
        next: data => {
          this.productos     = data;
          this.prodFiltrados = data;
          this.updatePagedData();
        },
        error: err => console.error('Error al obtener productos:', err)
      });
    }
  }

  /* --------- buscador --------- */
  buscarProducto(): void {
    const t = this.searchTerm.trim().toLowerCase();
    this.prodFiltrados = t
      ? this.productos.filter(p =>
          p.nombre.toLowerCase().includes(t) ||
          p.idproducto.toLowerCase().includes(t))
      : this.productos;

    this.pageIndex = 0;
    this.updatePagedData();
  }

  /* --------- paginación --------- */
  pageChanged(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;
    this.updatePagedData();
  }

  private updatePagedData(): void {
    const start = this.pageIndex * this.pageSize;
    const end   = start + this.pageSize;
    this.displayedProductos = this.prodFiltrados.slice(start, end);
  }

  /* --------- CRUD --------- */
  editarProducto(p: any): void {
    this.isEditMode = true;
    this.prodSeleccionado = { ...p };
  }

  guardarEdicion(): void {
    if (!this.prodSeleccionado) return;
    this.productoService.editarProducto(this.prodSeleccionado).subscribe({
      next: () => {
        this.isEditMode = false;
        this.prodSeleccionado = null;
        this.loadProducts();
      },
      error: err => console.error('Error al actualizar producto:', err)
    });
  }

  eliminarProducto(id: string): void {
    if (!confirm('¿Eliminar este producto?')) return;
    this.productoService.eliminarProducto(id).subscribe({
      next: () => this.loadProducts(),
      error: err => console.error('Error al eliminar producto:', err)
    });
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.prodSeleccionado = null;
    this.loadProducts();
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.loadProducts();
  }

  downloadPdf(): void {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
  
    /* 1) Encabezado corporativo ------------------------------------------------ */
    const headerLines = [
      { txt: 'DAAYFOOD S.A.S', size: 16, bold: true  },
      { txt: 'Dirección: Dayuma, Vía principal, Calle C N/A y Km 40', size: 11 },
      { txt: 'Orellana-Ecuador', size: 11 },
      { txt: 'Teléfonos: 0992268003 – 0989989254', size: 11 }
    ];
  
    let y = 36;                               // margen superior
    headerLines.forEach(line => {
      doc.setFontSize(line.size);
      doc.setFont('helvetica', line.bold ? 'bold' : 'normal');
      doc.text(line.txt, pageWidth / 2, y, { align: 'center' });
      y += 16;                                // siguiente línea
    });
  
    /* Título de la tabla */
    y += 8;
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('LISTADO DE PRODUCTOS', pageWidth / 2, y, { align: 'center' });
    y += 18;
  
    /* 2) Datos ----------------------------------------------------------------- */
    const headers = [[
      'Código', 'Nombre', 'Proveedor', 'Categoría', 'Fecha Expiración', 'Stock'
    ]];
  
    const body = this.prodFiltrados.map(p=> [
      p.idproducto, p.nombre, p.proveedor.nombre,
      p.categorias.categoria, p.fecha_caducidad, p.stock
    ]);
  
    /* 3) autoTable ------------------------------------------------------------- */
    autoTable(doc, {
      head: headers,
      body,
      startY: y,
      theme: 'grid',
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: 255,
        halign: 'center',
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 10, textColor: 60 },
      styles: { cellPadding: 4, overflow: 'linebreak' }
    });
  
    /* 4) Descargar ------------------------------------------------------------- */
    doc.save('Productos.pdf');
  }
}
