import { Component, OnInit } from '@angular/core';
import { CargosService } from '../../services/cargos.service';

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

  constructor(private cargoService: CargosService) {}

  ngOnInit(): void {
   
    this.obtenerCargos();
    this.cargarLista();
  }

  obtenerCargos(): void {
    this.cargoService.getCargos().subscribe({
      next: (data) => {
        this.cargo = data;
        this.cargoFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener cargos', err);
      },
    });
  }

  buscarCargos(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.cargoFiltrados = this.cargo; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.cargoFiltrados = this.cargo.filter((cargo) =>
        cargo.nombrecargo.toLowerCase().includes(searchTermLower) ||
        cargo.idcargo.toLowerCase().includes(searchTermLower) // Filtra también por código
      );
    }
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
}
