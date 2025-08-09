import { Component, OnInit , Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-servicios-cliente',
  templateUrl: './servicios-cliente.component.html',
  styleUrls: ['./servicios-cliente.component.css'],
  standalone: false,
})
export class ServiciosClienteComponent implements OnInit {
  servicio: any[] = [];
   @Output() cerrar = new EventEmitter<void>();


  servicioSeleccionado: any = null;
  mostrarServicioNoDisponibleModal: boolean = false;

  constructor(
    private _auth: AuthService,
    private servCatering: ServiciocateringService,
    private _router: Router
  ) {}

  ngOnInit(): void {
    this.obtenerServicios();
  }

  logout(): void {
    this._auth.logOut();
    this._router.navigate(['login']);
  }

  obtenerServicios(): void {
    this.servCatering.getServicio()
      .pipe(
        tap((data) => {
          // Mapear cada servicio para incluir la URL de la imagen
          this.servicio = data.map((s: any) => {
            const fotografiaUrl = `http://localhost:8010/api/getfotografia/${s.imagen}/true`;
            return { ...s, fotografiaUrl };
          });
        })
      )
      .subscribe({
        next: () => console.log('Servicios cargados correctamente.'),
        error: (err) => console.error('Error al obtener los servicios:', err),
      });
  }

  // Al hacer clic en una imagen
  verDetalles(s: any): void {
    this.servicioSeleccionado = s;
  }

  // Cerrar el modal
  cerrarDetalles(): void {
    this.servicioSeleccionado = null;
  }

  // Ir a la vista de menús (puedes ajustar la ruta según tu app)
  mostrarMenus(): void {
    if (this.servicioSeleccionado) {
      if (this.servicioSeleccionado.estado.estado === 'No disponible') {
        this.mostrarServicioNoDisponibleModal = true;
      } else {
        const idServicio = this.servicioSeleccionado.idservicio;
        this._router.navigate(['/menusCliente', idServicio]);
        this.cerrarDetalles();
      }
    }
  }

  cerrarModalNoDisponible(): void {
    this.mostrarServicioNoDisponibleModal = false;
  }

  volver(): void {
    this.cerrar.emit();
  }
}
