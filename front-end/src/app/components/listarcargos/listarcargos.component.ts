import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CargosService } from '../../services/cargos.service';
import { PageEvent } from '@angular/material/paginator'; 
import { MatDialog } from '@angular/material/dialog';
import { CargosComponent } from '../cargos/cargos.component';

@Component({
  selector: 'app-listarcargos',
  standalone: false,
  
  templateUrl: './listarcargos.component.html',
  styleUrl: './listarcargos.component.css'
})
export class ListarcargosComponent implements OnInit {
  cargo: any[] = [];
  cargoFiltrados: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  cargoSeleccionado: any = null;
  displayedCargos: any[] = [];
  pageSize = 10;
  pageIndex = 0;

   @Output() cerrar = new EventEmitter<void>();

 
  volver(): void {
    this.cerrar.emit();
  }


  constructor(private cargoService: CargosService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
   
    this.obtenerCargos();
    this.cargarLista();
  }

  obtenerCargos(): void {
    this.cargoService.getCargos().subscribe({
      next: data => {
        this.cargo = data;
        this.cargoFiltrados = data;
        this.updatePagedData();          // ← llena la primera página
      },
      error: err => console.error('Error al obtener cargos', err)
    });
  }

  buscarCargos(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.cargoFiltrados = term
      ? this.cargo.filter(c =>
          c.nombrecargo.toLowerCase().includes(term) ||
          c.idcargo.toLowerCase().includes(term))
      : this.cargo;

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
    this.displayedCargos = this.cargoFiltrados.slice(start, end);
  }


  editarCargos(cargo: any): void {
    this.isEditMode = true;
    this.cargoSeleccionado = { ...cargo }; // Copia para evitar modificar el original
  }

  guardarEdicion(): void {
    if (this.cargoSeleccionado) {
      this.cargoService.editarCargo(this.cargoSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.cargoSeleccionado = null;
          this.obtenerCargos();
        },
        error: (err) => {
          console.error('Error al actualizar el cargos:', err);
        },
      });
    }
  }
  

  eliminarCargos(idcargo: string): void {
    if (confirm('¿Está seguro de que desea eliminar este cargo?')) {
      this.cargoService.eliminarCargo(idcargo).subscribe({
        next: () => {
          this.obtenerCargos();
        },
        error: (err) => {
          console.error('Error al eliminar cargo:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.cargoSeleccionado = null;
  }
  cargarLista(): void {
    this.cargoService.getCargos().subscribe({
      next: (data) => {
        this.cargo = data;
        this.cargoFiltrados = data;
        this.pageIndex = 0;          // ← vuelvo a la primera página
      this.updatePagedData(); 
      },
      error: (err) => {
        console.error('Error al obtener los cargos:', err);
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }

  abrirDialogoAgregar(): void {
      const dialogRef = this.dialog.open(CargosComponent, {
        width: '600px',          // o el ancho que prefieras
         disableClose: true,
      autoFocus: false  
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'added') {   // se envía desde el diálogo
          this.obtenerCargos();      // refresca la tabla
        }
      });
    }
}
