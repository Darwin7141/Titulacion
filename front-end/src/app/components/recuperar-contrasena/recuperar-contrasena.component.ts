import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RecuperarContrasenaService } from '../../services/recuperar-contrasena.service';
@Component({
  selector: 'app-recuperar-contrasena',
  standalone: false,
  
  templateUrl: './recuperar-contrasena.component.html',
  styleUrl: './recuperar-contrasena.component.css'
})
export class RecuperarContrasenaComponent {
  correo: string = '';

  constructor(private recuperarService: RecuperarContrasenaService, private router: Router) {}

  solicitarRecuperacion() {
    if (this.correo) {
      this.recuperarService.solicitarRecuperacion({ correo: this.correo }).subscribe({
        next: (response) => {
          alert('Se ha enviado un enlace para recuperar tu contraseña');
          this.router.navigate(['/login']);  // Redirige al login
        },
        error: (err) => {
          alert('Hubo un error al enviar el correo. Intenta de nuevo.');
          console.error(err);
        }
      });
    }
  }
}
