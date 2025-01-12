import { Component, OnInit } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  usuario = {
    correo: '', // Para almacenar el valor del nombre de usuario
    contrasenia: '', // Para almacenar el valor de la contraseña
  };

  // Variables de control
  maxIntentos = 3;
  intentos = 0;
  tiempoBloqueo = 0;
  bloquearCampos = false;
  bloqueoTimeout: any;

  constructor(
    private _serviceLogin: LoginService,
    private _router: Router
  ) {}

  ngOnInit() {}

  login() {
    if (this.bloquearCampos) {
      alert('Has excedido el número máximo de intentos. Intenta nuevamente en un minuto.');
      return;
    }

    this._serviceLogin.login(this.usuario).subscribe({
      next: (response) => {
        // Si el login es exitoso, se restablece el contador de intentos
        this.intentos = 0;
        localStorage.setItem('identity_user', JSON.stringify(response.usuario));
        this._router.navigate(['/admin/list/']);
      },
      error: (err) => {
        console.error('Error en el inicio de sesión:', err);
        this.intentos++;

        // Si el número de intentos alcanza el máximo, bloquear los campos y configurar el temporizador
        if (this.intentos >= this.maxIntentos) {
          this.bloquearCampos = true;
          this.tiempoBloqueo = 60; // Bloqueo de 1 minuto

          // Mostrar un mensaje de alerta al usuario
          alert('Has excedido el número máximo de intentos. Intenta nuevamente en un minuto.');

          // Configurar el temporizador para desbloquear los campos después de 1 minuto
          this.bloqueoTimeout = setInterval(() => {
            this.tiempoBloqueo--;
            if (this.tiempoBloqueo <= 0) {
              this.bloquearCampos = false;
              clearInterval(this.bloqueoTimeout);
            }
          }, 1000); // 1 segundo de intervalo para actualizar el tiempo de bloqueo
        }
      },
    });
  }
}
