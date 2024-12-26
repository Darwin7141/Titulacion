import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: false,
  
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent  implements OnInit{

  usuario = {
    usuario: '', // Para almacenar el valor del nombre de usuario
    password: ''  // Para almacenar el valor de la contraseña
  }; 
  


  login() {
    // Lógica de inicio de sesión
    console.log('Iniciando sesión con el usuario:', this.usuario);
  }

  ngOnInit(): void {
    
  }
}
