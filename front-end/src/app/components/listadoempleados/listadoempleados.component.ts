import { Component, OnInit ,Output, EventEmitter} from '@angular/core';
import { EmpleadosService } from '../../services/empleados.service';
import { PageEvent } from '@angular/material/paginator'; 
import { MatDialog } from '@angular/material/dialog';
import { EmpleadosComponent } from '../empleados/empleados.component';

@Component({
  selector: 'app-listadoempleados',
  standalone: false,
  templateUrl: './listadoempleados.component.html',
  styleUrl: './listadoempleados.component.css',
})
export class ListadoempleadosComponent implements OnInit {
  empleado: any[] = [];
  empleadosFiltrados: any[] = [];
  cargo: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  empleadoSeleccionado: any = null;
  displayedEmpleados: any[] = [];
  pageSize = 5;
  pageIndex = 0;

  @Output() cerrar = new EventEmitter<void>();

  
  volver(): void {
    this.cerrar.emit();
  }

  constructor(private empleadosService: EmpleadosService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.empleadosService.getCargosEmpleados().subscribe({
      next: (data) => {
        this.cargo = data; // Asigna los cargos a la lista
      },
      error: (err) => {
        console.error('Error al obtener cargos:', err);
      },
    });
    this.obtenerEmpleados();
    this.cargarLista();
  }

  obtenerEmpleados(): void {
    this.empleadosService.getEmpleados().subscribe({
      next: (data) => {
        this.empleado = data;
        this.empleadosFiltrados = data;
        this.updatePagedData();
      },
      error: (err) => {
        console.error('Error al obtener empleados:', err);
      },
    });
  }

  buscarEmpleado(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.empleadosFiltrados = this.empleado; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.empleadosFiltrados = this.empleado.filter((empleado) =>
        empleado.nombre.toLowerCase().includes(searchTermLower) ||
        empleado.ci.toLowerCase().includes(searchTermLower) // Filtra también por código
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
    this.displayedEmpleados = this.empleadosFiltrados.slice(start, end);
  }

 

  guardarEdicion(): void {
    if (this.empleadoSeleccionado) {
      this.empleadosService.editarEmpleado(this.empleadoSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.empleadoSeleccionado = null;
          this.obtenerEmpleados();
        },
        error: (err) => {
          console.error('Error al actualizar empleado:', err);
        },
      });
    }
  }

  eliminarEmpleado(codigoempleado: string): void {
    if (confirm('¿Está seguro de que desea eliminar este empleado?')) {
      this.empleadosService.eliminarEmpleado(codigoempleado).subscribe({
        next: () => {
          this.obtenerEmpleados();
        },
        error: (err) => {
          console.error('Error al eliminar empleado:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.empleadoSeleccionado = null;
  }
  cargarLista(): void {
    this.empleadosService.getEmpleados().subscribe({
      next: (data) => {
        this.empleado = data;
        this.empleadosFiltrados = data;
        this.pageIndex = 0;          // ← vuelvo a la primera página
      this.updatePagedData(); 
      },
      error: (err) => {
        console.error('Error al obtener empleados:', err);
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }
  abrirDialogoAgregar(): void {
      const dialogRef = this.dialog.open(EmpleadosComponent, {
        width: '600px',          // o el ancho que prefieras
         disableClose: true,
      autoFocus: false  
      }).afterClosed().subscribe(flag => {
          if (flag) this.obtenerEmpleados();   // ← refresca con 'saved' o el que envíes
        });
      }
      
        editarEmpleado(emp: any): void {
        this.dialog.open(EmpleadosComponent, {
          width: '600px',
          disableClose: true,
          autoFocus: false,
          data: { emp }                 // enviamos el registro
        }).afterClosed().subscribe(flag => {
          if (flag) this.obtenerEmpleados();   // ← refresca con 'saved' o el que envíes
        });
      }
}


