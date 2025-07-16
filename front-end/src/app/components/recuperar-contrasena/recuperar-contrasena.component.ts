import { Component } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';
import { RecuperarContrasenaService } from '../../services/recuperar-contrasena.service';
import { finalize } from 'rxjs/operators';
@Component({
  selector: 'app-recuperar-contrasena',
  standalone: false,
  
  templateUrl: './recuperar-contrasena.component.html',
  styleUrl: './recuperar-contrasena.component.css'
})
export class RecuperarContrasenaComponent {
  correo: string = '';
  isLoading = false;

  constructor(private recuperarService: RecuperarContrasenaService, private router: Router) {}

  solicitarRecuperacion(): void {
  if (!this.correo) { return; }

  /* 1️⃣ Spinner integrado de SweetAlert */
  const loading = Swal.fire({
    title: 'Enviando solicitud…',
    text : 'Por favor espera',
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  /* 2️⃣ Llamada al servicio */
  this.recuperarService
      .solicitarRecuperacion({ correo: this.correo })
      .subscribe({
        next: () => {
          Swal.close();                          // cierra el spinner
          Swal.fire({
            icon : 'success',
            title: 'Éxito',
            text : 'Revisa tu correo para restablecer tu contraseña.'
          }).then(() => this.router.navigate(['/login']));
        },
        error: err => {
          console.error(err);
          Swal.close();                          // cierra el spinner
          Swal.fire({
            icon : 'error',
            title: 'Error',
            text : 'No se pudo enviar el enlace. Intenta de nuevo.'
          });
        }
      });
}}