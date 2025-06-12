import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { ProductosService } from '../../services/productos.service';
import { ReservasService } from '../../services/reservas.service';

type Op = 
  | { action: 'add' | 'subtract'; idproducto: string; cantidad: number }
  | { action: 'delete';     idproducto: string; };

@Component({
  selector: 'app-gestion-productos',
  templateUrl: './gestion-productos.component.html',
  styleUrl: './gestion-productos.component.css',
  standalone: false,
})
export class GestionProductosComponent implements OnInit {
  productos: any[] = [];
  filtrados: any[] = [];
  search = '';

  seleccionado: any = null;
  cantidad = 1;

  asignados: Array<{ producto: any, cantidad: number }> = [];

  private pendingOps: Op[] = [];

  constructor(
    private prodSvc: ProductosService,
    private resSvc: ReservasService,
    private dialogRef: MatDialogRef<GestionProductosComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idreserva: string }
  ) {}

  ngOnInit() {
    this.prodSvc.getProducto().subscribe(list => {
      this.productos = list;
      this.filtrados = [...list];
    });

    this.resSvc.getProductosDeReserva(this.data.idreserva)
      .subscribe(items => {
        const map = new Map<string, { producto: any, cantidad: number }>();
        items.forEach(i => {
          const key = i.producto.idproducto;
          if (map.has(key)) {
            map.get(key)!.cantidad += i.cantidad;
          } else {
            map.set(key, { producto: i.producto, cantidad: i.cantidad });
          }
        });
        this.asignados = Array.from(map.values());
      });
  }

  filtrar() {
    const t = this.search.trim().toLowerCase();
    this.filtrados = t
      ? this.productos.filter(p =>
          p.nombre.toLowerCase().includes(t) ||
          p.idproducto.toLowerCase().includes(t))
      : [...this.productos];
  }

  select(p: any) {
    this.seleccionado = p;
    this.cantidad = 1;
  }

  agregar() {
    if (!this.seleccionado || this.cantidad < 1 || this.cantidad > this.seleccionado.stock) {
      return;
    }
    // 1) reflejo en UI:
    const existente = this.asignados.find(a =>
      a.producto.idproducto === this.seleccionado.idproducto
    );
    if (existente) {
      existente.cantidad += this.cantidad;
    } else {
      this.asignados.push({
        producto: this.seleccionado,
        cantidad: this.cantidad
      });
    }
    this.seleccionado.stock -= this.cantidad;

    // 2) apunto operación pendiente
    this.pendingOps.push({
      action: 'add',
      idproducto: this.seleccionado.idproducto,
      cantidad: this.cantidad
    });

    this.cantidad = 1;
  }

  incrementar(item: { producto: any, cantidad: number }) {
    if (item.producto.stock < 1) return;
    item.cantidad += 1;
    item.producto.stock -= 1;
    this.pendingOps.push({
      action: 'add',
      idproducto: item.producto.idproducto,
      cantidad: 1
    });
  }

  disminuir(item: { producto: any, cantidad: number }) {
    if (item.cantidad <= 0) return;
    item.cantidad -= 1;
    item.producto.stock += 1;
    this.pendingOps.push({
      action: 'subtract',
      idproducto: item.producto.idproducto,
      cantidad: 1
    });
    if (item.cantidad === 0) {
      // marcar borrado
      this.pendingOps.push({
        action: 'delete',
        idproducto: item.producto.idproducto
      });
      this.asignados = this.asignados.filter(a =>
        a.producto.idproducto !== item.producto.idproducto
      );
    }
  }

  eliminar(item: { producto: any, cantidad: number }) {
    // devolver stock
    item.producto.stock += item.cantidad;
    // marcar borrado
    this.pendingOps.push({
      action: 'delete',
      idproducto: item.producto.idproducto
    });
    this.asignados = this.asignados.filter(a =>
      a.producto.idproducto !== item.producto.idproducto
    );
  }

  save() {
    if (!this.pendingOps.length) {
      this.dialogRef.close(true);
      return;
    }
    const calls = this.pendingOps.map(op => {
      switch (op.action) {
        case 'add':
          return this.resSvc.agregarProductoReserva(this.data.idreserva, {
            idproducto: op.idproducto,
            cantidad:   op.cantidad
          });
        case 'subtract':
          return this.resSvc.restarProductoReserva(this.data.idreserva, {
            idproducto: op.idproducto,
            cantidad:   op.cantidad
          });
        case 'delete':
          return this.resSvc.eliminarProductoReserva(
            this.data.idreserva,
            op.idproducto
          );
      }
    });
    forkJoin(calls).subscribe({
      next: () => this.dialogRef.close(true),
      error: err => {
        console.error(err);
        alert('Error al guardar cambios');
      }
    });
  }

  cancel() {
    this.dialogRef.close(false);
  }
}
