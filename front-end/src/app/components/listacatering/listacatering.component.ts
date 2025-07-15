import { Component, OnInit, Output, EventEmitter} from '@angular/core';
import { TipocateringService } from '../../services/tipocatering.service';
import { PageEvent } from '@angular/material/paginator'; 
import { MatDialog } from '@angular/material/dialog';
import { TipocateringComponent } from '../tipocatering/tipocatering.component';

@Component({
  selector: 'app-listacatering',
  standalone: false,
  
  templateUrl: './listacatering.component.html',
  styleUrl: './listacatering.component.css'
})
export class ListacateringComponent implements OnInit {
  tipo: any[] = [];
  tipoFiltrados: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  tipoSeleccionado: any = null;
  estados: any[] = [];
  displayedTipos: any[] = [];
  pageSize = 5;
  pageIndex = 0;

  @Output() cerrar = new EventEmitter<void>();

  
  volver(): void {
    this.cerrar.emit();
  }

  constructor(private tipoService: TipocateringService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {

    this.tipoService.getEstados().subscribe({
      next: (data) => {
        this.estados = data; // Asigna los cargos a la lista
      },
      error: (err) => {
        console.error('Error al obtener los estados:', err);
      },
    });
   
    this.obtenerTipos();
    this.cargarLista();
  }

  obtenerTipos(): void {
    this.tipoService.getTipo().subscribe({
      next: (data) => {
        this.tipo = data;
        this.tipoFiltrados = data;
        this.updatePagedData();
      },
      error: (err) => {
        console.error('Error al obtener los tipos de catering', err);
      },
    });
  }

  buscarTipos(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.tipoFiltrados = this.tipo; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.tipoFiltrados = this.tipo.filter((tipo) =>
        tipo.idtipo.toLowerCase().includes(searchTermLower) ||
        tipo.nombre.toLowerCase().includes(searchTermLower) // Filtra también por código
      );
    }
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
    this.displayedTipos = this.tipoFiltrados.slice(start, end);
  }

  editarTipos(tipo: any): void {
    this.isEditMode = true;
    this.tipoSeleccionado = { ...tipo }; // Copia para evitar modificar el original
  }

  guardarEdicion(): void {
    if (this.tipoSeleccionado) {
      this.tipoService.editarTipo(this.tipoSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.tipoSeleccionado = null;
          this.obtenerTipos();
        },
        error: (err) => {
          console.error('Error al actualizar el tipo:', err);
        },
      });
    }
  }
  

  eliminarTipos(idtipo: string): void {
    if (confirm('¿Está seguro de que desea eliminar este tipo de catering?')) {
      this.tipoService.eliminarTipo(idtipo).subscribe({
        next: () => {
          this.obtenerTipos();
        },
        error: (err) => {
          console.error('Error al eliminar el tipo de catering', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.tipoSeleccionado = null;
  }
  cargarLista(): void {
    this.tipoService.getTipo().subscribe({
      next: (data) => {
        this.tipo = data;
        this.tipoFiltrados = data;
        this.pageIndex = 0;                 // resetea a la 1.ª página
    this.updatePagedData();
      },
      error: (err) => {
        console.error('Error al obtener los tipos de catering:', err);
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }

  abrirDialogoAgregar(): void {
      const dialogRef = this.dialog.open(TipocateringComponent, {
        width: '600px',          // o el ancho que prefieras
         disableClose: true,
      autoFocus: false  
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'added') {   // se envía desde el diálogo
          this.obtenerTipos();      // refresca la tabla
        }
      });
    }
}
