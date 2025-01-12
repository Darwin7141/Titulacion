import { Component, OnInit} from '@angular/core';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { TipocateringService } from '../../services/tipocatering.service';

@Component({
  selector: 'app-listarservicio',
  standalone: false,
  
  templateUrl: './listarservicio.component.html',
  styleUrl: './listarservicio.component.css'
})
export class ListarservicioComponent implements OnInit {
  servicio: any[] = [];
  servFiltrados: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  servSeleccionado: any = null;
  tipo: any[] = [];

  constructor(
    private cateringService: ServiciocateringService,
    private tipoCatering: TipocateringService
  ) {}

  ngOnInit(): void {
    this.tipoCatering.getTipo().subscribe({
      next: (data) => {
        this.tipo = data; // Asigna los cargos a la lista
      },
      error: (err) => {
        console.error('Error al obtener cargos:', err);
      },
    });
   
    this.obtenerServicios();
    this.cargarLista();
  }

  obtenerServicios(): void {
    this.cateringService.getServicio().subscribe({
      next: (data) => {
        this.servicio = data;
        this.servFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener los servicios:', err);
      },
    });
  }

  

  buscarServicios(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.servFiltrados = this.servicio; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.servFiltrados = this.servicio.filter((servicio) =>
        servicio.nombre.toLowerCase().includes(searchTermLower) ||
        servicio.idservicio.toLowerCase().includes(searchTermLower) // Filtra también por código
      );
    }
  }

  editarServicios(servicio: any): void {
    this.isEditMode = true;
    this.servSeleccionado = { ...servicio }; // Copia para evitar modificar el original
  }

  guardarEdicion(): void {
    if (this.servSeleccionado) {
      this.cateringService.editarServicio(this.servSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.servSeleccionado = null;
          this.obtenerServicios();
        },
        error: (err) => {
          console.error('Error al actualizar el servicio:', err);
        },
      });
    }
  }

  eliminarServicios(idservicio: string): void {
    if (confirm('¿Está seguro de que desea eliminar este servicio?')) {
      this.cateringService.eliminarServicio(idservicio).subscribe({
        next: () => {
          this.obtenerServicios();
        },
        error: (err) => {
          console.error('Error al eliminar el servicio:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.servSeleccionado = null;
  }
  cargarLista(): void {
    this.cateringService.getServicio().subscribe({
      next: (data) => {
        this.servicio = data;
        this.servFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener los servicios:', err);
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }
}
