import { Component , OnInit } from '@angular/core';
import { ReservasService } from '../../services/reservas.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-mis-reservas',
  standalone: false,
  
  templateUrl: './mis-reservas.component.html',
  styleUrl: './mis-reservas.component.css'
})
export class MisReservasComponent implements OnInit {

  reservas: any[] = [];

  constructor(
    private reservasService: ReservasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1) Obtener al cliente logueado (o su codigocliente) desde localStorage
    const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
    console.log('DEBUG: user en localStorage:', user);

    const codigocliente = user?.codigocliente || null;
    console.log('DEBUG: codigocliente:', codigocliente);

    if (codigocliente) {
      // Si existe el codigocliente, cargamos las reservas
      this.cargarReservasCliente(codigocliente);
    } else {
      console.warn('No hay codigocliente en localStorage');
      // Si no existe codigocliente, mostrar un mensaje o redirigir al login
      
    }
}
  cargarReservasCliente(codigocliente: string): void {
    this.reservasService.getReservasByCliente(codigocliente).subscribe({
      next: (resp) => {
        // resp puede ser un array de reservas
        this.reservas = resp;
        // Asegúrate que tu backend devuelva un array con 
        // { idreserva, fechaevento, direccionevento, total, detalles: [...] }
      },
      error: (err) => {
        console.error('Error al obtener reservas del cliente:', err);
      }
    });
  }

  editarReserva(idreserva: string) {
    // Navegar a tu “EditarReservaComponent”
    this.router.navigate(['/editarReservas', idreserva]);
  }

  eliminarReserva(idreserva: string) {
    // Confirmación
    if (!confirm('¿Está seguro de eliminar esta reserva?')) return;

    // Llamar al servicio de eliminar
    this.reservasService.deleteReserva(idreserva).subscribe({
      next: () => {
        // Luego recargar la lista
        this.reservas = this.reservas.filter(r => r.idreserva !== idreserva);
        // O volver a cargar con this.cargarReservasCliente(...)
      },
      error: (err) => {
        console.error('Error al eliminar reserva:', err);
      }
    });
  }
}