import { Component, OnInit, Inject, HostListener, ViewChild, ElementRef,ViewEncapsulation  } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { ProductosService } from '../../services/productos.service';
import { ReservasService } from '../../services/reservas.service';
import Swal from 'sweetalert2';

type Op =
  | { action: 'add' | 'subtract'; idproducto: string; cantidad: number }
  | { action: 'delete'; idproducto: string };

@Component({
  selector: 'app-gestion-productos',
  templateUrl: './gestion-productos.component.html',
  styleUrl: './gestion-productos.component.css',
  standalone: false,
  encapsulation: ViewEncapsulation.None 
})
export class GestionProductosComponent implements OnInit {
  productos: any[] = [];
  filtrados: any[] = [];
  search = '';

  seleccionado: any = null;
  cantidad = 1;

  // para resaltar selección en la lista (↑/↓/Enter)
  selectedIndex = -1;

  asignados: Array<{ producto: any; cantidad: number }> = [];
  private pendingOps: Op[] = [];

  @ViewChild('listScroll', { static: false }) listScroll?: ElementRef<HTMLDivElement>;
  @ViewChild('searchBox', { static: false }) searchBox?: ElementRef<HTMLInputElement>;

  constructor(
    private prodSvc: ProductosService,
    private resSvc: ReservasService,
    private dialogRef: MatDialogRef<GestionProductosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idreserva: string }
  ) {}

  ngOnInit() {
    this.prodSvc.getProducto().subscribe((list) => {
      this.productos = list;
      this.filtrados = [...list];
    });

    this.resSvc.getProductosDeReserva(this.data.idreserva).subscribe((items) => {
      const map = new Map<string, { producto: any; cantidad: number }>();
      items.forEach((i) => {
        const key = i.producto.idproducto;
        map.set(
          key,
          map.has(key)
            ? { producto: i.producto, cantidad: map.get(key)!.cantidad + i.cantidad }
            : { producto: i.producto, cantidad: i.cantidad }
        );
      });
      this.asignados = Array.from(map.values());
    });
  }

  /* ---------- Filtro + selección ---------- */
  filtrar() {
    const t = this.search.trim().toLowerCase();
    this.filtrados = t
      ? this.productos.filter(
          (p) =>
            p.nombre.toLowerCase().includes(t) ||
            (p.idproducto || '').toLowerCase().includes(t)
        )
      : [...this.productos];

    // reseteo selección
    this.selectedIndex = this.filtrados.length ? 0 : -1;
    this.seleccionado = this.filtrados[this.selectedIndex] || null;
    this.cantidad = 1;
  }

  selectByIndex(i: number) {
    if (i < 0 || i >= this.filtrados.length) return;
    const p = this.filtrados[i];
    if (p?.stock === 0) return; // deshabilitado
    this.selectedIndex = i;
    this.seleccionado = p;
    this.cantidad = 1;
    this.scrollIntoView(i);
  }

  select(p: any, i: number) {
    this.selectedIndex = i;
    this.seleccionado = p;
    this.cantidad = 1;
  }

  private scrollIntoView(i: number) {
    const host = this.listScroll?.nativeElement;
    if (!host) return;
    const row = host.querySelectorAll('.dp-row')[i] as HTMLElement;
    if (row) row.scrollIntoView({ block: 'nearest' });
  }

  /* ---------- Atajos de teclado ---------- */
  @HostListener('document:keydown', ['$event'])
  keyHandler(e: KeyboardEvent) {
    // si el foco está en el input de búsqueda no interceptamos +/-
    const target = e.target as HTMLElement;
    const typingInSearch = target?.tagName === 'INPUT' && target === this.searchBox?.nativeElement;

    if (e.key === 'ArrowDown') {
      this.selectByIndex(Math.min(this.selectedIndex + 1, this.filtrados.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      this.selectByIndex(Math.max(this.selectedIndex - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (this.seleccionado && this.canAdd) this.agregar();
    } else if ((e.key === '+' || e.key === '=') && !typingInSearch) {
      this.stepCantidad(+1);
      e.preventDefault();
    } else if ((e.key === '-' || e.key === '_') && !typingInSearch) {
      this.stepCantidad(-1);
      e.preventDefault();
    }
  }

  /* ---------- Cantidad / validar ---------- */
  stepCantidad(delta: number) {
    if (!this.seleccionado) return;
    const next = (this.cantidad || 0) + delta;
    this.cantidad = Math.max(1, next);
  }

  get excedeStock(): boolean {
    return !!this.seleccionado && this.cantidad > (this.seleccionado?.stock ?? 0);
  }

  get canAdd(): boolean {
    return !!this.seleccionado && this.cantidad > 0 && !this.excedeStock && this.seleccionado.stock > 0;
  }

  /* ---------- Operaciones de UI + cola de cambios ---------- */
  agregar() {
    if (!this.canAdd) return;

    const existente = this.asignados.find(
      (a) => a.producto.idproducto === this.seleccionado.idproducto
    );
    if (existente) {
      existente.cantidad += this.cantidad;
    } else {
      this.asignados.push({ producto: this.seleccionado, cantidad: this.cantidad });
    }
    this.seleccionado.stock -= this.cantidad;

    this.pendingOps.push({
      action: 'add',
      idproducto: this.seleccionado.idproducto,
      cantidad: this.cantidad,
    });

    this.cantidad = 1;
  }

  incrementar(item: { producto: any; cantidad: number }) {
    if (item.producto.stock < 1) return;
    item.cantidad += 1;
    item.producto.stock -= 1;
    this.pendingOps.push({ action: 'add', idproducto: item.producto.idproducto, cantidad: 1 });
  }

  disminuir(item: { producto: any; cantidad: number }) {
    if (item.cantidad <= 0) return;
    item.cantidad -= 1;
    item.producto.stock += 1;
    this.pendingOps.push({ action: 'subtract', idproducto: item.producto.idproducto, cantidad: 1 });

    if (item.cantidad === 0) {
      this.pendingOps.push({ action: 'delete', idproducto: item.producto.idproducto });
      this.asignados = this.asignados.filter(
        (a) => a.producto.idproducto !== item.producto.idproducto
      );
    }
  }

  eliminar(item: { producto: any; cantidad: number }) {
    item.producto.stock += item.cantidad;
    this.pendingOps.push({ action: 'delete', idproducto: item.producto.idproducto });
    this.asignados = this.asignados.filter(
      (a) => a.producto.idproducto !== item.producto.idproducto
    );
  }

  /* ---------- precios opcionales ---------- */
  get showPrecios(): boolean {
    return this.asignados.some((a) => typeof a.producto?.precio === 'number');
  }
  subtotal(a: { producto: any; cantidad: number }): number {
    return (a.producto?.precio ?? 0) * a.cantidad;
  }
  total(): number {
    return this.asignados.reduce((acc, a) => acc + this.subtotal(a), 0);
  }

  /* ---------- guardar / cancelar ---------- */
  save() {
    if (!this.pendingOps.length) {
      this.dialogRef.close(true);
      return;
    }
    const calls = this.pendingOps.map((op) => {
      switch (op.action) {
        case 'add':
          return this.resSvc.agregarProductoReserva(this.data.idreserva, {
            idproducto: op.idproducto,
            cantidad: op.cantidad,
          });
        case 'subtract':
          return this.resSvc.restarProductoReserva(this.data.idreserva, {
            idproducto: op.idproducto,
            cantidad: op.cantidad,
          });
        case 'delete':
          return this.resSvc.eliminarProductoReserva(this.data.idreserva, op.idproducto);
      }
    });

    forkJoin(calls).subscribe({
      next: () => {
        Swal.fire({
          width: 480,
          html: `
            <div class="swal-pro-check"></div>
            <h2 class="swal-pro-title">Cambios guardados</h2>
            <p class="swal-pro-desc">Los productos se actualizaron correctamente.</p>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Listo',
          buttonsStyling: false,
          customClass: {
            popup: 'swal-pro',
            confirmButton: 'swal-pro-confirm',
            htmlContainer: 'swal-pro-html',
          },
        }).then(() => this.dialogRef.close(true));
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          width: 480,
          html: `
            <div class="swal-pro-error"></div>
            <h2 class="swal-pro-title">Error al guardar</h2>
            <p class="swal-pro-desc">Inténtalo de nuevo.</p>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Listo',
          buttonsStyling: false,
          customClass: {
            popup: 'swal-pro',
            confirmButton: 'swal-pro-confirm',
            htmlContainer: 'swal-pro-html',
          },
        });
      },
    });
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
