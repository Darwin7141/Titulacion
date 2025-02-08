import { Component , OnInit } from '@angular/core';
import { ReservasService } from '../../services/reservas.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'app-listar-reservas',
  standalone: false,
  
  templateUrl: './listar-reservas.component.html',
  styleUrl: './listar-reservas.component.css'
})
export class ListarReservasComponent implements OnInit {
  reserva: any[] = [];
  resFiltrados: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  resSeleccionado: any = null;

  constructor(private resService: ReservasService) {}

  ngOnInit(): void {
   
    this.obtenerReserva();
    this.cargarLista();
  }

  obtenerReserva(): void {
    this.resService.getAllReservas().subscribe({
      next: (data) => {
        this.reserva = data;
        this.resFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener reservas:', err);
      },
    });
  }

  buscarReserva(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.resFiltrados = this.reserva; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.resFiltrados = this.reserva.filter((usuario) =>
        usuario.cliente.nombre.toLowerCase().includes(searchTermLower) ||
        usuario.idreserva.toLowerCase().includes(searchTermLower) // Filtra también por código
      );
    }
  }

  editarReserva(usuario: any): void {
    this.isEditMode = true;
    this.resSeleccionado = { ...usuario }; // Copia para evitar modificar el original
  }

  guardarReserva(): void {
    if (this.resSeleccionado) {
      this.resService.editarTotal(this.resSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.resSeleccionado = null;
          this.obtenerReserva();
        },
        error: (err) => {
          console.error('Error al actualizar reserva:', err);
        },
      });
    }
  }

  eliminarReserva(idreserva: string): void {
    if (confirm('¿Está seguro de que desea eliminar esta reserva?')) {
      this.resService.deleteReserva(idreserva).subscribe({
        next: () => {
          this.obtenerReserva();
        },
        error: (err) => {
          console.error('Error al eliminar reserva:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.resSeleccionado = null;
  }
  cargarLista(): void {
    this.resService.getAllReservas().subscribe({
      next: (data) => {
        this.reserva = data;
        this.resFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener reservas:', err);
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }
}


