import { Component, OnInit, Output, EventEmitter} from '@angular/core';
import { MenusService } from '../../services/menus.service';
import { ClientesService } from '../../services/clientes.service';
import { ReservasService } from '../../services/reservas.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

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
    private router: Router
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
   
  }
  
  agregarMenuDesdeSelect(selectedIdMenu: string, cantStr: string) {
    const menuEncontrado = this.menus.find(m => m.idmenu === selectedIdMenu);
    if (!menuEncontrado) {
      Swal.fire({
        icon: 'warning',
        title: 'Menú no válido',
        text: 'Seleccione un menú de la lista.'
      });
      return;
    }

    const cant = parseInt(cantStr, 10);
    if (isNaN(cant) || cant <= 0) {
      Swal.fire({
        icon: 'error',
        title: 'Cantidad inválida',
        text: 'La cantidad debe ser un número entero mayor a 0.'
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
        icon: 'error',
        title: 'Fecha inválida',
        text: 'Seleccione una fecha de evento válida.'
      });
      return false;
    }
    if (fechaEvento <= hoy) {
      Swal.fire({
        icon: 'error',
        title: 'Fecha no permitida',
        text: 'La fecha del evento debe ser mayor a la fecha actual.'
      });
      return false;
    }
    if (this.menusSeleccionados.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'No hay menús',
        text: 'Agregue al menos un menú para la reserva.'
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
          icon: 'error',
          title: 'Fecha no disponible',
          text: 'La fecha seleccionada para su reserva no está disponible. Por favor elija otra fecha para su reserva.'
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
        const nuevas = JSON.parse(localStorage.getItem('nuevasReservas') || '[]');

      // 2) Agregar la nueva ID de reserva
      nuevas.push(respReserva.idreserva);

      // 3) Guardar de nuevo en localStorage
      localStorage.setItem('nuevasReservas', JSON.stringify(nuevas));

      window.dispatchEvent(new CustomEvent('nuevasReservasActualizado'));

        Swal.fire({
          icon: 'success',
          title: 'Reserva generada',
          text: `Su reserva ha sido creada con éxito`,
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
        const nuevas = JSON.parse(localStorage.getItem('nuevasReservas') || '[]');
      nuevas.push(resp.idreserva);
      localStorage.setItem('nuevasReservas', JSON.stringify(nuevas));

      window.dispatchEvent(new CustomEvent('nuevasReservasActualizado'));

        const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
    user.codigocliente = resp.codigocliente;
    localStorage.setItem('identity_user', JSON.stringify(user))
        Swal.fire({
          icon: 'success',
          title: 'Reserva generada',
          text: `Su reserva fue creada`
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
}

