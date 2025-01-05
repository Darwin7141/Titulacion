import { Component, OnInit } from '@angular/core';
//import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { InicioService } from '../../services/inicio.service';

@Component({
  selector: 'app-inicio',
  standalone: false,
  
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.css'
})
export class InicioComponent implements OnInit{

  usuario = {
    correo: '', // Para almacenar el valor del nombre de usuario
    contrasenia: '', // Para almacenar el valor de la contraseña
  };


  constructor(
    //private _auth:AuthService,
    private _serviceLogin: InicioService,
    private _router:Router){}
    //logout(){
     // this._auth.logOut();
     // this._router.navigate(['/admin/list']);

  //  }

    ngOnInit() {
      
    }
    inicio() {
      this._serviceLogin.inicio(this.usuario).subscribe({
        next: (response) => {
         
            localStorage.setItem('identity_user', JSON.stringify(response.usuario));
            this._router.navigate(['/admin/list/']);
          
          // Aquí puedes manejar la respuesta, como guardar un token o redirigir al usuario
        },
        error: (err) => {
          console.error('Error en el inicio de sesión:', err);
          // Aquí puedes manejar el error, como mostrar un mensaje al usuario
        },
      });
    }

  }