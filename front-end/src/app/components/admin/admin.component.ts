import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin',
  standalone: false,
  
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit{

  showGestionUsuarios = false;
  showProductos = false;
  showCatering = false;
  userEmail: string = '';
  hayNuevasReservas = false;
  reservasNuevas: string[] = [];

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
      // Asignamos el correo del usuario logueado
      this.userEmail = user.correo;
    } else {
      // Si no hay correo, mostramos algo por defecto
      this.userEmail = 'Invitado';
    }
    const arr = localStorage.getItem('nuevasReservas');
    if (arr) {
      this.reservasNuevas = JSON.parse(arr);
    }
  }

  get hayNuevas(): boolean {
    return this.reservasNuevas.length > 0;
  }

  get cantidadNuevas(): number {
    return this.reservasNuevas.length;
    }

    toggleGestionUsuarios() {
      this.showGestionUsuarios = !this.showGestionUsuarios;
    }
  
    toggleProductos() {
      this.showProductos = !this.showProductos;
    }
  
    toggleCatering() {
      this.showCatering = !this.showCatering;
    }
    verNotificaciones() {
      // Si no hay reservas nuevas
      if (this.reservasNuevas.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Sin novedades',
          text: 'No hay reservas nuevas.'
        });
        return;
      }
  
      // Mostrar la lista de IDreservas nuevas
      // Podrías usar SweetAlert2 con HTML personalizado
      let htmlContent = `
        <p>Reservas nuevas:</p>
        <ul style="text-align: left;">
      `;
      for (const id of this.reservasNuevas) {
        htmlContent += `
          <li style="cursor: pointer; color: blue;"
              onclick="window.selectReserva('${id}')">
            Reserva: ${id}
          </li>
        `;
      }
      htmlContent += '</ul>';
  
      // Truco: SweetAlert2 no expone onclick "directo"
      // Podemos usar "window.selectReserva = (id) => {...}" (definida en TS) o
      // un approach custom. 
      // Ejemplo rápido:
      (window as any).selectReserva = (idReserva: string) => {
        // Llamamos a un método de Angular (ver paso 3)
        this.irAListaReservas(idReserva);
      };
  
      Swal.fire({
        icon: 'info',
        title: 'Nuevas Reservas',
        html: htmlContent,
        showConfirmButton: false,
        showCloseButton: true
      });
    }
    irAListaReservas(idreserva: string) {
      // Primero cerramos SweetAlert
      Swal.close();
  
      // Eliminamos esa reserva del array (ya "vista")
      this.reservasNuevas = this.reservasNuevas.filter(r => r !== idreserva);
      localStorage.setItem('nuevasReservas', JSON.stringify(this.reservasNuevas));
  
      // Navegar a la lista de reservas con un query param
      // Ej: /listaReservas?highlight=R007
      this._router.navigate(['/listaReservas'], { queryParams: { highlight: idreserva } });
    }
  }
  


