import { Component, OnInit } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  usuario = {
    correo: '', // Para almacenar el valor del nombre de usuario
    contrasenia: '', // Para almacenar el valor de la contraseña
  };

  constructor(
    private _serviceLogin: LoginService,
    private _router:Router) {}

  ngOnInit() {}

  login() {
    this._serviceLogin.login(this.usuario).subscribe({
      next: (response) => {
       
          localStorage.setItem('identity_user', JSON.stringify(response.usuario));
          this._router.navigate(['/inicio/']);
        
        // Aquí puedes manejar la respuesta, como guardar un token o redirigir al usuario
      },
      error: (err) => {
        console.error('Error en el inicio de sesión:', err);
        // Aquí puedes manejar el error, como mostrar un mensaje al usuario
      },
    });
  }
}
