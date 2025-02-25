import { Component , OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservasService } from '../../services/reservas.service';
import { MenusService } from '../../services/menus.service'; // si necesitas cargar menú
import Swal from 'sweetalert2';

@Component({
  selector: 'app-editar-reserva',
  standalone: false,
  
  templateUrl: './editar-reserva.component.html',
  styleUrl: './editar-reserva.component.css'
})
export class EditarReservaComponent implements OnInit {

  idreserva = '';  // vendrá de la ruta
  reserva = {
    idreserva: '',
    fechaevento: '',
    direccionevento: '',
    precio: 0,
    cantpersonas: 0,
    total: 0,
    detalles: [] as Array<any> // [{idmenu, cantpersonas, preciounitario, subtotal, menu:{...}}]
  };

  // Si quieres que el usuario pueda agregar menús nuevos, 
  // necesitarás la lista de menús:
  menusDisponibles: any[] = [];
  reservaIndex: number = -1;

  constructor(
    private route: ActivatedRoute,
    private reservasService: ReservasService,
    private menusService: MenusService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1) Leer param
    this.idreserva = this.route.snapshot.paramMap.get('idreserva') || '';

    // 2) Cargar la reserva con detalles
    this.cargarReserva(this.idreserva);

    // 3) Cargar menús si deseas que el usuario agregue menús extra
    this.menusService.getMenu().subscribe({
      next: (data) => {
        this.menusDisponibles = data;
      },
      error: (err) => console.error('Error al cargar menús:', err)
    });
  }
  
  cargarReserva(id: string) {
    this.reservasService.getReservaById(id).subscribe({
      next: (resp) => {
        // 'resp' es la reserva con la estructura del backend
        // Ej: { idreserva, fechaevento, direccionevento, total, detalles: [...] }
        this.reserva.idreserva = resp.idreserva;
        this.reserva.fechaevento = resp.fechaevento;
        this.reserva.direccionevento = resp.direccionevento;
        this.reserva.precio = resp.precio;
        this.reserva.cantpersonas = resp.cantpersonas;
        this.reserva.total = resp.total;

        // Convertimos el "detalles" a un array editable
        this.reserva.detalles = resp.detalles.map((d: any) => ({
          idmenu: d.idmenu,
          cantpersonas: d.cantpersonas,
          preciounitario: d.preciounitario,
          subtotal: d.subtotal,
          menu: d.menu  // { nombre, precio, etc.}
        }));
      },
      error: (err) => {
        console.error('Error al obtener reserva:', err);
        // Manejar error o navegar a otro lado
      }
    });
  }

  // ================== Métodos para editar los detalles ==================
  // Ej: Cambiar la cantidad en un detalle
  onCantidadChange(index: number, nuevaCantidadStr: string) {
    const nuevaCant = parseInt(nuevaCantidadStr, 10) || 0;
    if (nuevaCant <= 0) {
      Swal.fire({ icon: 'warning', title: 'Cantidad inválida', text: 'Debe ser mayor a 0' });
      return;
    }
    this.reserva.detalles[index].cantpersonas = nuevaCant;
    // recalcula subtotal
    this.reserva.detalles[index].subtotal = 
      this.reserva.detalles[index].preciounitario * nuevaCant;
    // recalcular totales
    this.recalcularCabecera();
  }

  // Cambiar menú en una fila, si permites
  onMenuSelectChange(index: number, idmenuSeleccionado: string) {
    const menuEncontrado = this.menusDisponibles.find(m => m.idmenu === idmenuSeleccionado);
    if (!menuEncontrado) {
      Swal.fire({ icon: 'error', title: 'Menú inválido' });
      return;
    }
    // actualiza
    this.reserva.detalles[index].idmenu = menuEncontrado.idmenu;
    this.reserva.detalles[index].preciounitario = menuEncontrado.precio;
    this.reserva.detalles[index].menu = menuEncontrado;
    // recalcular subtotal
    const cant = this.reserva.detalles[index].cantpersonas || 1;
    this.reserva.detalles[index].subtotal = menuEncontrado.precio * cant;
    this.recalcularCabecera();
  }

  // Quitar un detalle
  quitarDetalle(index: number) {
    this.reserva.detalles.splice(index, 1);
    this.recalcularCabecera();
  }

  // Agregar un "nuevo detalle" vacío, 
  // o con un menú y cantidad por defecto
  agregarDetalle() {
    this.reserva.detalles.push({
      idmenu: '',
      cantpersonas: 1,
      preciounitario: 0,
      subtotal: 0,
      menu: null
    });
  }

  cancelarEdicion() {
    this.router.navigate(['/misReservas']);
  }

  recalcularCabecera() {
    let sumaTotal = 0;
    let sumaPersonas = 0;
    for (const det of this.reserva.detalles) {
      sumaTotal += det.subtotal;
      sumaPersonas += det.cantpersonas;
    }
    this.reserva.total = sumaTotal;
    this.reserva.cantpersonas = sumaPersonas;
    // si usas 'precio' para algo adicional, ajústalo
  }

  // ================== Guardar cambios (PUT) ==================
  guardarEdicion() {
    const detallesTransformados = this.reserva.detalles.map(d => ({
      idmenu: d.idmenu,
      cantpersonas: d.cantpersonas,
      preciounitario: d.preciounitario,
      subtotal: d.subtotal
    }));
  
    const body = {
      fechaevento: this.reserva.fechaevento,
      direccionevento: this.reserva.direccionevento,
      precio: this.reserva.precio, // El precio es calculado con base en los detalles
      cantpersonas: this.reserva.cantpersonas, // Total de personas
      total: this.reserva.total, // Total de la reserva
      detalle: detallesTransformados // Detalles de los menús seleccionados
    };
  
    this.reservasService.editarReserva(this.idreserva, body).subscribe({
      next: (resp) => {
        Swal.fire({
          icon: 'success',
          title: 'Reserva actualizada',
          text: 'Se guardaron los cambios correctamente'
        }).then(() => {
          this.router.navigate(['/misReservas']); // Redirige a la lista de reservas
        });
      },
      error: (err) => {
        console.error('Error al actualizar la reserva:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al actualizar la reserva.'
        });
      }
    });
  }
}
