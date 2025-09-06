import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface DetalleReserva {
  menu?: { nombre: string } | null;   // ← opcional para permitir item.menu?.nombre
  cantpersonas: number;
  preciounitario: number;
  subtotal: number;
}

export interface ReservaDialogData {
  id: string;
  cliente?: string;
  fechaevento: string | Date;
  direccionevento: string;
  total: number;
  primer_pago: number;
  segundo_pago: number;
  saldo_pendiente: number;
  detalles: DetalleReserva[];
}

@Component({
  selector: 'app-notificacion-pago',
  templateUrl: './notificacion-pago.component.html',
  styleUrls: ['./notificacion-pago.component.css'],
  standalone: false,  
  encapsulation: ViewEncapsulation.None
  
})
export class NotificacionPagoComponent implements OnInit {
  fechaStr = '';
  idSufijo = '';  // ← para el título “R{{ idSufijo }}”

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ReservaDialogData,
    private dialogRef: MatDialogRef<NotificacionPagoComponent>
  ) {}

  ngOnInit(): void {
    const f = new Date(this.data.fechaevento);
    this.fechaStr = f.toLocaleDateString();

    // Quita una “R” inicial si existe, sin usar regex en la plantilla
    this.idSufijo = String(this.data.id ?? '')
      .replace(/^R/i, ''); // aquí sí puedes usar regex porque es TS
  }

  get totalMenus(): number {
    return this.data.detalles?.reduce((acc, d) => acc + (d.subtotal ?? 0), 0) ?? 0;
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
