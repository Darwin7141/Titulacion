import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inicio-cliente',
  standalone: false,
  
  templateUrl: './inicio-cliente.component.html',
  styleUrl: './inicio-cliente.component.css'
})
export class InicioClienteComponent implements OnInit{

  userEmail: string = '';
  hayNuevas: boolean = false;  // Variable para saber si hay notificaciones nuevas
  cantidadNuevas: number = 0;

  constructor(
    private _auth:AuthService,
    private _router:Router){}
    logout(){
      
      this._auth.logOut();
      
      this._router.navigate(['login']);

    }

    ngOnInit() {

      const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
    if (user && user.correo) {
      this.userEmail = user.correo;
    } else {
      this.userEmail = 'Invitado';
    }

    // Aquí podrías realizar una comprobación de nuevas notificaciones
    // Esto es solo un ejemplo de cómo podrías manejar las notificaciones
    this.checkNotificaciones();
      
    }

    checkNotificaciones() {
      const nuevas = JSON.parse(localStorage.getItem('nuevasNotificaciones') || '[]');
      this.hayNuevas = nuevas.length > 0;
      this.cantidadNuevas = nuevas.length;
    }
    abrirInstrucciones() {
      Swal.fire({
        title: 'Instrucciones',
        html: `
          <ul>
            <li>Asigne la fecha y hora del evento.</li>
            <li>Seleccione un menú y asigne la cantidad de personas para ese menú.</li>
            <li>Presione en "Agregar menú".</li>
            <li>Si desea, puede agregar o quitar un menú.</li>
            <li>Una vez elegido sus menús, presione en "Generar reserva".</li>
            <li>Presione en "Pagar ahora" o "Pagar más tarde".</li>
            <li>Realice el pago y su reserva será generada automáticamente.</li>
          </ul>
        `,
        icon: 'info',
        confirmButtonText: 'Entendido'
      }).then(() => {
        // Redirigir a la vista de Agendar Reserva
        
      });
    }

    verNotificaciones() {
      if (this.hayNuevas) {
        Swal.fire({
          title: 'Tienes nuevas notificaciones',
          text: `Tienes ${this.cantidadNuevas} notificaciones nuevas.`,
          icon: 'info',
          confirmButtonText: 'Cerrar'
        });
      } else {
        Swal.fire({
          title: 'Sin notificaciones',
          text: 'No tienes notificaciones nuevas.',
          icon: 'info',
          confirmButtonText: 'Cerrar'
        });
      }
    }
  
}

