import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RecuperarContrasenaService } from '../../services/recuperar-contrasena.service';

@Component({
  selector: 'app-restablecer-contrasena',
  standalone: false,
  
  templateUrl: './restablecer-contrasena.component.html',
  styleUrl: './restablecer-contrasena.component.css'
})
export class RestablecerContrasenaComponent implements OnInit {
  token: string = '';
  nuevaContrasena: string = '';
  confirmacionContrasena: string = '';

  constructor(
    private route: ActivatedRoute,
    private recuperarService: RecuperarContrasenaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener el token de la URL
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  restablecerContrasena() {
    if (this.nuevaContrasena !== this.confirmacionContrasena) {
      alert('Las contraseñas no coinciden');
      return;
    }
    // Verificar el contenido antes de enviar
    console.log({
      token: this.token,
      nuevaContrasena: this.nuevaContrasena,
    });
  
    this.recuperarService.restablecerContraseña({
      token: this.token,
      nuevaContrasena: this.nuevaContrasena
    }).subscribe({
      next: (response) => {
        console.log('Respuesta del back-end:', response);
        alert('Contraseña restablecida exitosamente');
        this.router.navigate(['/login']);  // Redirigir al login
      },
      error: (err) => {
        console.error('Error en el servicio:', err);
        alert('Hubo un error al restablecer la contraseña');
        console.error(err);
      }
    });
  }
}  