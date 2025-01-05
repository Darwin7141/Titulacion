import { Component, OnInit } from '@angular/core';
import { EmpleadosService } from '../../services/empleados.service';

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

  constructor(private empleadosService: EmpleadosService) {}

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
      },
      error: (err) => {
        console.error('Error al obtener empleados:', err);
      },
    });
  }

  buscarEmpleado(): void {
    if (this.searchTerm.trim() === '') {
      this.empleadosFiltrados = this.empleado;
    } else {
      this.empleadosFiltrados = this.empleado.filter((empleado) =>
        empleado.nombre.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  editarEmpleado(empleado: any): void {
    this.isEditMode = true;
    this.empleadoSeleccionado = { ...empleado }; // Copia para evitar modificar el original
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
}


