import { Component , OnInit } from '@angular/core';
import { ReservasService } from '../../services/reservas.service';
import { ActivatedRoute } from '@angular/router';
import { EstadoReservaService } from '../../services/estado-reserva.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';  
import Swal from 'sweetalert2';
import { forkJoin } from 'rxjs';
import { GestionProductosComponent } from '../gestion-productos/gestion-productos.component';
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
  pagedRes: any[] = [];

  pageSize = 10;
  currentPage = 1;
  totalPages = 0;
  pages: number[] = [];

  constructor(
    private resService: ReservasService,
    private estadoService: EstadoReservaService,
    private route: ActivatedRoute,
    private router:Router,
    private dialog: MatDialog,
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
      next: data => {
        this.reserva = data;
        this.resFiltrados = data;        // asignas todos a resFiltrados…

        // si venimos con highlight, filtras…
        if (this.highlightedReserva) {
          this.resFiltrados = this.resFiltrados
            .filter(r => r.idreserva === this.highlightedReserva);
          this.router.navigate([], { relativeTo: this.route, queryParams: {} });
        }

        this.setupPagination();          // ← y aquí arrancas la paginación
      },
      error: err => console.error(err)
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

  private setupPagination() {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.resFiltrados.length / this.pageSize) || 1;
    this.pages = Array.from({length: this.totalPages}, (_, i) => i + 1);
    this.updatePagedRes();
  }

  private updatePagedRes() {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedRes = this.resFiltrados.slice(start, start + this.pageSize);
  }

  goToPage(p: number) {
    if (p < 1 || p > this.totalPages) return;
    this.currentPage = p;
    this.updatePagedRes();
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  buscarReserva(): void {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      this.resFiltrados = [...this.reserva];
    } else {
      this.resFiltrados = this.reserva.filter(res =>
        res.cliente.nombre.toLowerCase().includes(term) ||
        res.idreserva.toLowerCase().includes(term) ||
        res.cliente.ci.toLowerCase().includes(term)
      );
    }
    this.setupPagination();
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.highlightedReserva = null;
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
    this.cargarReservas();
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

        const codigocliente = itemReserva.cliente.codigocliente;
      const nombreCliente = itemReserva.cliente.nombre;

      // 2) Determinar el texto según el estado seleccionado (itemReserva.idestado corresponde a un ID numérico,
      //    así que tal vez necesites traducirlo a texto legible; aquí asumimos que en estadosReserva ya tienes
      //    una lista de objetos { idestado, estado_reserva }):
      const estadoObj = this.estadosReserva.find(e => e.idestado === itemReserva.idestado);
      const textoEstado = estadoObj ? estadoObj.estado_reserva : 'Desconocido';

      let mensajeNotificacion = '';
      switch (textoEstado) {
        case 'Aceptada':
          mensajeNotificacion = `Su reserva ${itemReserva.idreserva} ha sido Aceptada. Por favor realice el abono inicial.`;
          break;
        case 'En proceso':
          mensajeNotificacion = `Su reserva ${itemReserva.idreserva} se encuentra En proceso.`;
          break;
        case 'Pagada':
          mensajeNotificacion = `Su reserva ${itemReserva.idreserva} ha sido Pagada. ¡Gracias por preferirnos!`;
          break;
        case 'Cancelada':
          mensajeNotificacion = `Su reserva ${itemReserva.idreserva} ha sido Cancelada.`;
          break;
        default:
          mensajeNotificacion = `Su reserva ${itemReserva.idreserva} cambió a estado "${textoEstado}".`;
      }

      // 3) Leer (o inicializar) el array de notificaciones que guardamos en localStorage para este cliente
      //    Lo almacenaremos en la clave 'notificacionesCliente_<codigocliente>'
      const keyNotifs = `notificacionesCliente_${codigocliente}`;
const actualesJSON = localStorage.getItem(keyNotifs) || '[]';
const actuales = JSON.parse(actualesJSON) as any[];
actuales.push({ texto: mensajeNotificacion, reservaId: itemReserva.idreserva, fecha: new Date().toISOString() });
localStorage.setItem(keyNotifs, JSON.stringify(actuales));
window.dispatchEvent(new CustomEvent('nuevasNotificacionesClienteActualizado'));

      // ————— FIN CÓDIGO NUEVO —————

      Swal.fire({
        icon: 'success',
        title: 'Cambios guardados',
        text: 'Los cambios se han guardado correctamente.',
        confirmButtonText: 'Aceptar'
      });
    },
    error: (err) => {
      console.error('Error al actualizar estado:', err);
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
    forkJoin({
      reserva: this.resService.getReservaById(idreserva),
      asignados: this.resService.getProductosDeReserva(idreserva)
    }).subscribe({
      next: ({ reserva: resCompleta, asignados }) => {
        // ——— 1) Agrupo duplicados en un Map ———
        const map = new Map<string, { producto: any, cantidad: number }>();
        asignados.forEach(item => {
          const key = item.producto.idproducto;
          if (map.has(key)) {
            map.get(key)!.cantidad += item.cantidad;
          } else {
            map.set(key, { producto: item.producto, cantidad: item.cantidad });
          }
        });
        const agregados = Array.from(map.values());

        // ——— 2) Construyo el HTML ———
        let html = `
          <div style="text-align:left; font-family:Arial,sans-serif;">
          <p><strong>Reserva:</strong> ${resCompleta.idreserva}</p>
            <p><strong>Fecha:</strong> ${resCompleta.fechaevento}</p>
            <p><strong>Dirección:</strong> ${resCompleta.direccionevento}</p>
        `;
        if (resCompleta.nombre?.estado_reserva) {
          html += `
            <p><strong>Estado:</strong>
              <span style="
                background:#d1ecf1; color:#0c5460;
                padding:4px 8px; border-radius:12px;
                font-weight:bold; display:inline-block;">
                ${resCompleta.nombre.estado_reserva}
              </span>
            </p>
          `;
        }
        // tabla de detalles de menú
        html += `
          <table style="width:100%; border-collapse:collapse; margin-top:16px;">
            <thead>
              <tr style="background:#f1f1f1; font-weight:bold;">
                <th style="border:1px solid #ddd; padding:8px;">Menú</th>
                <th style="border:1px solid #ddd; padding:8px;">Precio Unit.</th>
                <th style="border:1px solid #ddd; padding:8px;">Cant.</th>
                <th style="border:1px solid #ddd; padding:8px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
        `;
        resCompleta.detalles.forEach((d: any) => {
          html += `
            <tr>
              <td style="border:1px solid #ddd; padding:8px;">${d.menu?.nombre}</td>
              <td style="border:1px solid #ddd; padding:8px;">${d.preciounitario}</td>
              <td style="border:1px solid #ddd; padding:8px;">${d.cantpersonas}</td>
              <td style="border:1px solid #ddd; padding:8px;">${d.subtotal}</td>
            </tr>
          `;
        });
        html += `
            <tr>
              <td colspan="3" style="border:1px solid #ddd; padding:8px; text-align:right; font-weight:bold;">
                Total:
              </td>
              <td style="border:1px solid #ddd; padding:8px;">
                ${resCompleta.total ?? '0.00'}
              </td>
            </tr>
            </tbody>
          </table>
        `;

        // tabla de productos asignados (agrupados)
        html += `
          <h4 style="margin-top:24px;">Productos asignados</h4>
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr>
                <th style="border:1px solid #ddd; padding:8px;">Producto</th>
                <th style="border:1px solid #ddd; padding:8px;">Cantidad</th>
              </tr>
            </thead>
            <tbody>
        `;
        agregados.forEach(item => {
          html += `
            <tr>
              <td style="border:1px solid #ddd; padding:8px;">${item.producto.nombre}</td>
              <td style="border:1px solid #ddd; padding:8px;">${item.cantidad}</td>
            </tr>
          `;
        });
        html += `</tbody></table></div>`;

        // ——— 3) Muestro SweetAlert2 ———
        Swal.fire({
          title: '',
          html,
          icon: 'info',
          width: 600,
          showDenyButton: true,
          denyButtonText: 'Gestionar',
          confirmButtonText: 'Cerrar'
        })
        .then(res => {
          if (res.isDenied) {
            const ref = this.dialog.open(GestionProductosComponent, {
  width: '800px',
  data: { idreserva }
});

ref.afterClosed().subscribe(saved => {
  if (saved) {
    // el usuario pulsó Guardar → recarga tu lista de reservas
    this.cargarReservas();
  }
});
          }
        });
      },
      error: () => Swal.fire('Error', 'No se pudo cargar la reserva', 'error')
    });
  }

  
}