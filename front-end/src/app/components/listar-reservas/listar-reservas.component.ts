import { Component , OnInit } from '@angular/core';
import { ReservasService } from '../../services/reservas.service';
import { ActivatedRoute } from '@angular/router';
import { EstadoReservaService } from '../../services/estado-reserva.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
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
  estadosReserva: any[] = [];
  highlightedReserva: string | null = null;

  constructor(
    private resService: ReservasService,
    private estadoService: EstadoReservaService,
    private route: ActivatedRoute,
    private router:Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['highlight']) {
        this.highlightedReserva = params['highlight'];
      }
    });

    
    this.cargarReservas();
    this.cargarEstados();

    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTerm = params['search'];
        this.buscarReserva();
        
      }
    });
  }

  cargarReservas(): void {
    this.resService.getAllReservas().subscribe({
      next: (data) => {
        this.reserva = data;
        this.resFiltrados = data;
  
        // *** AHORA que ya tenemos la lista, filtramos si hay highlight
        if (this.highlightedReserva) {
          // Deja SOLO la reserva con el ID highlight
          this.resFiltrados = this.resFiltrados.filter(
            r => r.idreserva === this.highlightedReserva
          );
  
          // Remueve el param "highlight" de la URL para que,
          // si el usuario recarga la página, muestre TODAS las reservas
          this.route.queryParams.subscribe(() => {
            this.router.navigate(
              [],
              { 
                queryParams: { },  // Quita todos los query params
                relativeTo: this.route
              }
            );
          });
        }
      },
      error: (err) => console.error('Error al obtener reservas:', err),
    });
  }

  cargarEstados(): void {
    this.estadoService.getEstadoReserva().subscribe({
      next: (data) => {
        this.estadosReserva = data; 
      },
      error: (err) => {
        console.error('Error al obtener estados:', err);
      },
    });
  }

  // ============ Al presionar el botón "Guardar" en la fila ============
  guardarEstadoReserva(itemReserva: any) {
    const dataActualizar = {
      idestado: itemReserva.idestado
    };

    this.resService.editarReserva(itemReserva.idreserva, dataActualizar).subscribe({
      next: (resp) => {
        console.log('Estado actualizado correctamente', resp);
        this.cargarReservas();

        Swal.fire({
          icon: 'success',
          title: 'Cambios guardados',
          text: 'Los cambios se han guardado correctamente.',
          confirmButtonText: 'Aceptar'
        });
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        
        // Mostrar un mensaje de error si la actualización falla
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo guardar los cambios. Inténtelo nuevamente.',
          confirmButtonText: 'Cerrar'
        });
      }
    });
  }
  // ===================== Búsqueda ============================
  buscarReserva(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase();
    if (!searchTermLower) {
      this.resFiltrados = this.reserva;
      return;
    }
    this.resFiltrados = this.reserva.filter((res) =>
      res.cliente.nombre.toLowerCase().includes(searchTermLower) ||
      res.idreserva.toLowerCase().includes(searchTermLower) ||
      res.cliente.ci.toLowerCase().includes(searchTermLower) 
    );
  }

  recargarLista(): void {
    // Limpia el campo de búsqueda
    this.searchTerm = '';
    // Quita el valor de highlightedReserva si lo tienes
    this.highlightedReserva = null;
  
    // Elimina todos los queryParams de la URL
    this.router.navigate([], {
      queryParams: {},
      relativeTo: this.route,
    });
  
    // Vuelve a cargar todas las reservas
    this.cargarReservas();
  }

  // (Opcional) Método para eliminar la reserva, si todavía lo necesitas
  eliminarReserva(idreserva: string): void {
    if (confirm('¿Está seguro de que desea eliminar esta reserva?')) {
      this.resService.deleteReserva(idreserva).subscribe({
        next: () => this.cargarReservas(),
        error: (err) => console.error('Error al eliminar reserva:', err),
      });
    }
  }

  verDetalles(idreserva: string) {
    // 1) Llamar al servicio para obtener la reserva con todos sus detalles
    this.resService.getReservaById(idreserva).subscribe({
      next: (resCompleta) => {
        // resCompleta => { fechaevento, direccionevento, total, nombre: { estado_reserva }, detalles: [...] }

        // 2) Construir el HTML sin "Reserva: Nro X", ni Editar/Eliminar
        let htmlContent = `
        <div style="font-family: Arial, sans-serif; text-align:left;">
          <p><strong>Fecha:</strong> ${resCompleta.fechaevento}</p>
          <p><strong>Dirección:</strong> ${resCompleta.direccionevento}</p>
        `;

        // Estado con badge
        if (resCompleta.nombre?.estado_reserva) {
          htmlContent += `
          <p><strong>Estado:</strong>
            <span style="
              background-color: #d1ecf1; 
              color: #0c5460; 
              padding: 4px 8px; 
              border-radius: 12px; 
              font-weight: bold;
              display: inline-block;">
              ${resCompleta.nombre.estado_reserva}
            </span>
          </p>
          `;
        }

        // Tabla de detalles
        htmlContent += `
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <thead>
              <tr style="background-color: #f1f1f1; font-weight: bold;">
                <th style="border: 1px solid #ddd; padding: 8px;">Menú</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Precio Unit.</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Cant.</th>
                <th style="border: 1px solid #ddd; padding: 8px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
        `;

        resCompleta.detalles.forEach((det: any) => {
          htmlContent += `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${det.menu?.nombre || ''}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${det.preciounitario}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${det.cantpersonas}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${det.subtotal}</td>
            </tr>
          `;
        });

        // Fila final para el total
        htmlContent += `
            <tr>
              <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">
                Total:
              </td>
              <td style="border: 1px solid #ddd; padding: 8px;">
                ${resCompleta.total ?? '0.00'}
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        `;

        // 3) Mostrar la ventana emergente con SweetAlert2
        Swal.fire({
          title: '',  // Sin "Reserva: Nro X"
          html: htmlContent,
          icon: 'info',
          confirmButtonText: 'Cerrar',  // Botón "Cerrar"
          width: '600px'                // Ajusta si quieres más ancho
        });
      },
      error: (err) => {
        console.error('Error al obtener detalles de reserva:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo obtener la información de la reserva.'
        });
      }
    });
  }
}