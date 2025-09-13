import { Component, OnInit, Output, EventEmitter} from '@angular/core';
import { MenusService } from '../../services/menus.service';
import { ClientesService } from '../../services/clientes.service';
import { ReservasService } from '../../services/reservas.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { SeleccionMenusService, SeleccionMenu } from '../../services/seleccion-menus.service';

@Component({
  selector: 'app-agendar-reserva',
  templateUrl: './agendar-reserva.component.html',
  styleUrls: ['./agendar-reserva.component.css'],
  standalone: false,
})
export class AgendarReservaComponent implements OnInit{
  
  // Campos de la tabla reservas + precliente
  formReserva = {
    ci: '',
    nombre: '',
    telefono: '',
    direccion: '',
    e_mail: '',
    idprecliente: '',
    fechaevento: '',
    direccionevento: '',
    precio: 0,       // opcional
    cantpersonas: 0, // total de personas
    total: 0         // total de subtotales
  };

  // Menús disponibles
  menus: any[] = [];
  @Output() cerrar = new EventEmitter<void>();

  // Lista de menús seleccionados
  menusSeleccionados: Array<{
    idmenu: string;
    nombre: string;
    servicioName?: string;
    precioUnitario: number;
    cantpersonas: number;
    subtotal: number;
    idservicio?: string;
  }> = [];

  constructor(
    private menusService: MenusService,
    private clientesService: ClientesService,
    private reservasService: ReservasService, // <--- con el nuevo método
    private router: Router,
    private carrito: SeleccionMenusService
  ) {}

  ngOnInit(): void {
    // 1) Cargar menús
    this.menusService.getMenu().subscribe({
      next: (data) => {
        this.menus = data;
      },
      error: (err) => {
        console.error('Error al cargar menús:', err);
      },
    });

    const usuario = JSON.parse(localStorage.getItem('identity_user') || '{}');
  console.log('DEBUG: Datos del usuario cargados desde localStorage:', usuario);
  
    // Cargar datos del precliente desde localStorage
    if (usuario && usuario.rol===2) {  // Verifica si es precliente
      this.formReserva.ci = usuario.ci || '';
      this.formReserva.nombre = usuario.nombre || '';
      this.formReserva.telefono = usuario.telefono || '';
      this.formReserva.direccion = usuario.direccion || '';
      this.formReserva.e_mail = usuario.correo || '';
      this.formReserva.idprecliente = usuario.idprecliente || '';
    } else if (usuario && usuario.rol===3) {  // Verifica si es cliente
      this.formReserva.ci = usuario.ci || '';
      this.formReserva.nombre = usuario.nombre || '';
      this.formReserva.telefono = usuario.telefono || '';
      this.formReserva.direccion = usuario.direccion || '';
      this.formReserva.e_mail = usuario.correo || '';
      this.formReserva.idprecliente = usuario.idprecliente || '';
    } 

    this.menusSeleccionados = this.carrito.snapshot().map(x => ({ ...x }));
    this.calcularTotalesCabecera();

    // Si quieres que se actualice en vivo si el usuario sigue agregando:
    this.carrito.items$.subscribe(items => {
      this.menusSeleccionados = items.map(x => ({ ...x }));
      this.calcularTotalesCabecera();
    });
   
  }
  
  agregarMenuDesdeSelect(selectedIdMenu: string, cantStr: string) {
    const menuEncontrado = this.menus.find(m => m.idmenu === selectedIdMenu);
    if (!menuEncontrado) {
      Swal.fire({
                  width: 480,
                  html: `
                                  <div class="swal-pro-error"></div>
                                  <h2 class="swal-pro-title">Menú no válido</h2>
                                  <p class="swal-pro-desc">Seleccione un menú de la lista</p>
                                `,
                  showConfirmButton: true,
                  confirmButtonText: 'Entendido',
                  buttonsStyling: false,
                 customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
                  });
      return;
    }

    const cant = parseInt(cantStr, 10);
    if (isNaN(cant) || cant <= 0) {
      Swal.fire({
                     width: 480,
                    html: `
                      <div class="swal-pro-error"></div>
                      <h2 class="swal-pro-title">Cantidad no admitida</h2>
                      <p class="swal-pro-desc">La cantidad del menú debe ser al menos 1</p>
                    `,
                    showConfirmButton: true,
                    confirmButtonText: 'Entendido',
                    buttonsStyling: false,
                    customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
                    });
      return;
    }

    const subtotal = menuEncontrado.precio * cant;
    const item = {
      idmenu: menuEncontrado.idmenu,
      nombre: menuEncontrado.nombre,
      servicioName: menuEncontrado.servicio?.nombre || '',
      precioUnitario: menuEncontrado.precio,
      cantpersonas: cant,
      subtotal,
      idservicio: menuEncontrado.idservicio
    };

    this.menusSeleccionados.push(item);
    this.calcularTotalesCabecera();
  }

  quitarMenuSeleccionado(index: number) {
    this.menusSeleccionados.splice(index, 1);
    this.calcularTotalesCabecera();
  }

  private calcularTotalesCabecera() {
    let sumSubtotales = 0;
    let sumCant = 0;
    for (const item of this.menusSeleccionados) {
      sumSubtotales += item.subtotal;
      sumCant += item.cantpersonas;
    }
    this.formReserva.total = sumSubtotales;
    this.formReserva.cantpersonas = sumCant;
  }

  // ================== VALIDAR CAMPOS Y GENERAR RESERVA ==================
  private validarCampos(): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaEvento = new Date(this.formReserva.fechaevento);

    if (!this.formReserva.fechaevento || isNaN(fechaEvento.getTime())) {
      Swal.fire({
                  width: 480,
                  html: `
                            <div class="swal-pro-error"></div>
                            <h2 class="swal-pro-title">Fecha no permitida</h2>
                            <p class="swal-pro-desc">Seleccione una fecha válida para el evento</p>
                                `,
                  showConfirmButton: true,
                  confirmButtonText: 'Entendido',
                  buttonsStyling: false,
                 customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
                  });
      return false;
    }
    if (fechaEvento <= hoy) {
      Swal.fire({
                  width: 480,
                  html: `
                            <div class="swal-pro-error"></div>
                            <h2 class="swal-pro-title">Fecha no permitida</h2>
                            <p class="swal-pro-desc">La fecha del evento debe ser posterior a la fecha actual</p>
                                `,
                  showConfirmButton: true,
                  confirmButtonText: 'Entendido',
                  buttonsStyling: false,
                 customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
                  });
      return false;
    }
    if (this.menusSeleccionados.length === 0) {
      Swal.fire({
                     width: 480,
                    html: `
                      <div class="swal-pro-error"></div>
                      <h2 class="swal-pro-title">No hay menús seleccionados</h2>
                      <p class="swal-pro-desc">Agregue al menos un menú para la reserva</p>
                    `,
                    showConfirmButton: true,
                    confirmButtonText: 'Entendido',
                    buttonsStyling: false,
                    customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
                    });
      return false;
    }
    return true;
  }

  generarReserva() {
  if (!this.validarCampos()) return;

  // 1) Consulto todas las reservas
  this.reservasService.getAllReservas().subscribe({
    next: (all: any[]) => {
      
      const selectedDate = this.formReserva.fechaevento;
      const mismas = all.filter(r => {
        if (!r.fechaevento) return false;
        
        const fechaDbYmd = String(r.fechaevento).slice(0, 10);
        return fechaDbYmd === selectedDate;
      }).length;

      if (mismas >= 3) {
                    Swal.fire({
                     width: 480,
                    html: `
                      <div class="swal-pro-error"></div>
                      <h2 class="swal-pro-title">Fecha no disponible</h2>
                      <p class="swal-pro-desc">La fecha seleccionada para su reserva no está disponible. Por favor elija otra fecha para su reserva.</p>
                    `,
                    showConfirmButton: true,
                    confirmButtonText: 'Entendido',
                    buttonsStyling: false,
                    customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
                    });
        return;
      }
      // 2) Si hay menos de 3, sigo con mi lógica habitual
      this.verificarDuplicadosYObtenerCliente()
        .then(codCli => {
          if (codCli) {
            this.crearReservaConClienteExistente(codCli);
          } else {
            this.crearClienteYReservaEnUnSoloPaso();
          }
        })
        .catch(err => {
          console.error(err);
          Swal.fire({ icon: 'error', title: 'Error', text: 'Falló la verificación de cliente.' });
        });
    },
    error: err => {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No pude obtener reservas para verificar fecha.' });
    }
  });
}


  private verificarDuplicadosYObtenerCliente(): Promise<string | null> {
    // IGUAL que antes, no lo toques
    return new Promise((resolve, reject) => {
      // 1) Verificar cédula
      this.clientesService.verificarCedula(this.formReserva.ci).subscribe({
        next: (respCedula) => {
          if (respCedula.existe) {
            // => buscarPorCedula
            this.clientesService.buscarPorCedula(this.formReserva.ci).subscribe({
              next: (cliente) => resolve(cliente.codigocliente),
              error: (err) => reject(err),
            });
            return;
          }
          // 2) Verificar teléfono
          this.clientesService.verificarTelefono(this.formReserva.telefono).subscribe({
            next: (respTel) => {
              if (respTel.existe) {
                this.clientesService.buscarPorTelefono(this.formReserva.telefono).subscribe({
                  next: (cliente) => resolve(cliente.codigocliente),
                  error: (err) => reject(err),
                });
                return;
              }
              // 3) Verificar email
              this.clientesService.verificarEmail(this.formReserva.e_mail).subscribe({
                next: (respMail) => {
                  if (respMail.existe) {
                    this.clientesService.buscarPorEmail(this.formReserva.e_mail).subscribe({
                      next: (cliente) => resolve(cliente.codigocliente),
                      error: (err) => reject(err),
                    });
                  } else {
                    resolve(null);
                  }
                },
                error: (err) => reject(err),
              });
            },
            error: (err) => reject(err),
          });
        },
        error: (err) => reject(err),
      });
    });
  }

  volver(): void {
    this.cerrar.emit();
  }

  private crearReservaConClienteExistente(codigocliente: string) {
    // IGUAL que antes
    const detalle = this.menusSeleccionados.map(item => ({
      idmenu: item.idmenu,
      cantpersonas: item.cantpersonas,
      preciounitario: item.precioUnitario,
      subtotal: item.subtotal
    }));

    const dataReserva = {
      fechaevento: this.formReserva.fechaevento,
      direccionevento: this.formReserva.direccionevento,
      codigocliente,
      precio: this.formReserva.precio,
      cantpersonas: this.formReserva.cantpersonas,
      total: this.formReserva.total,
      detalle
    };

    const clienteReservaData = {
      ci: this.formReserva.ci,
      nombre: this.formReserva.nombre,
      telefono: this.formReserva.telefono,
      direccion: this.formReserva.direccion,
      e_mail: this.formReserva.e_mail,
      fechaevento: this.formReserva.fechaevento,
      direccionevento: this.formReserva.direccionevento,
      total: this.formReserva.total,
      menusSeleccionados: this.menusSeleccionados
    };
    console.log("Guardando datos del cliente en localStorage:", clienteReservaData);
    localStorage.setItem('clienteReservaData', JSON.stringify(clienteReservaData));

    // Llama a tu “createReserva” normal
    this.reservasService.createReserva(dataReserva).subscribe({
      next: (respReserva) => {
        this.carrito.clear(); 
        const nuevas = JSON.parse(localStorage.getItem('nuevasReservas') || '[]');

      // 2) Agregar la nueva ID de reserva
      nuevas.push(respReserva.idreserva);

      // 3) Guardar de nuevo en localStorage
      localStorage.setItem('nuevasReservas', JSON.stringify(nuevas));

      window.dispatchEvent(new CustomEvent('nuevasReservasActualizado'));

       Swal.fire({
  width: 480,
  html: `
    <div class="swal-pro-check"></div>
    <h2 class="swal-pro-title">Reserva generada</h2>
    <p class="swal-pro-desc">Su reserva ha sido creada con éxito</p>
  `,
  showConfirmButton: true,
  confirmButtonText: 'Listo',
  showCancelButton: false,
  buttonsStyling: false,
  focusConfirm: true,
  customClass: {
    popup: 'swal-pro',
    confirmButton: 'swal-pro-confirm',
    htmlContainer: 'swal-pro-html'
  }
}).then(() => {
  this.router.navigate(['/inicioCliente']);
});
      },
      error: (err) => {
        console.error('Error al crear reserva:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al crear la reserva.',
        });
      },
    });
  }


  private crearClienteYReservaEnUnSoloPaso() {
    // 1) Construimos un objeto “dataCompleta” con CLIENTE + RESERVA
    const detalle = this.menusSeleccionados.map(item => ({
      idmenu: item.idmenu,
      cantpersonas: item.cantpersonas,
      preciounitario: item.precioUnitario,
      subtotal: item.subtotal
    }));

    const dataCompleta = {
      // cliente
      ci: this.formReserva.ci,
      nombre: this.formReserva.nombre,
      telefono: this.formReserva.telefono,
      direccion: this.formReserva.direccion,
      e_mail: this.formReserva.e_mail,
      idprecliente: this.formReserva.idprecliente,

      // reserva
      fechaevento: this.formReserva.fechaevento,
      direccionevento: this.formReserva.direccionevento,
      precio: this.formReserva.precio,
      cantpersonas: this.formReserva.cantpersonas,
      total: this.formReserva.total,

      // array de menús
      detalle
    };

    localStorage.setItem('formReserva', JSON.stringify(dataCompleta));

    // 2) Llamar al nuevo método “crearClienteYReserva” (todo en uno)
    this.reservasService.crearClienteYReserva(dataCompleta).subscribe({
      next: (resp) => {
        this.carrito.clear(); 
        const nuevas = JSON.parse(localStorage.getItem('nuevasReservas') || '[]');
      nuevas.push(resp.idreserva);
      localStorage.setItem('nuevasReservas', JSON.stringify(nuevas));

      window.dispatchEvent(new CustomEvent('nuevasReservasActualizado'));

        const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
    user.codigocliente = resp.codigocliente;
    localStorage.setItem('identity_user', JSON.stringify(user))
        Swal.fire({
  width: 480,
  html: `
    <div class="swal-pro-check"></div>
    <h2 class="swal-pro-title">Reserva generada</h2>
    <p class="swal-pro-desc">Su reserva ha sido creada con éxito</p>
  `,
  showConfirmButton: true,
  confirmButtonText: 'Listo',
  showCancelButton: false,
  buttonsStyling: false,
  focusConfirm: true,
  customClass: {
    popup: 'swal-pro',
    confirmButton: 'swal-pro-confirm',
    htmlContainer: 'swal-pro-html'
  }
}).then(() => {
  this.router.navigate(['/inicioCliente']);
});
      },
      error: (err) => {
        console.error('Error al crear reserva:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Ocurrió un error al crear la reserva.'
        });
      }
    });
  }

   cancelar(): void {
    
    this.carrito.clear();                 
    this.menusSeleccionados = [];          
    this.calcularTotalesCabecera();        
    this.cerrar.emit();
  }
}

