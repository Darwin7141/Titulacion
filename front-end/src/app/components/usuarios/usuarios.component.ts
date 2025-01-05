import { Component, OnInit } from '@angular/core';
import { UsuariosService } from '../../services/usuarios.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-usuarios',
  standalone: false,
  
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent implements OnInit {
  usuarios = {
    correo: '',
    contrasenia: '', // Para almacenar el valor del nombre de usuario
    createdAt: '', // Para almacenar el valor de la contraseña
    updatedAt: '',
    
    
    
  };
    constructor(
      
      private serviceUsuario: UsuariosService,
        private _router:Router) {}
  
    ngOnInit():void {
      
    }
    agregar() {
      this.serviceUsuario.agregar(this.usuarios).subscribe({
        next: (response) => {
         
            localStorage.setItem('identity_user', JSON.stringify(response.usuario));
            this._router.navigate(['/listaUsuarios']);
          
          // Aquí puedes manejar la respuesta, como guardar un token o redirigir al usuario
        },
        error: (err) => {
          console.error('Error en enviar datos del usuario:', err);
          // Aquí puedes manejar el error, como mostrar un mensaje al usuario
        },
      });
    }
  }
