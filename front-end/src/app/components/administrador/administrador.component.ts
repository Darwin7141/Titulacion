import { Component, OnInit } from '@angular/core';
import { AdministradorService } from '../../services/administrador.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-administrador',
  standalone: false,
  
  templateUrl: './administrador.component.html',
  styleUrl: './administrador.component.css'
})
export class AdministradorComponent implements OnInit {
  administrador = {
    ci: '', // Para almacenar el valor del nombre de usuario
    nombre: '', // Para almacenar el valor de la contraseña
    direccion: '',
    e_mail: '',
    telefono: '',
    
    
  };

  admin: any[]=[];

    constructor(
      
      private serviceAdmin: AdministradorService,
        private _router:Router) {}
  
    ngOnInit():void {
      this.serviceAdmin.getAdministrador().subscribe({
        next: (data) => {
          this.admin= data; // Asigna los cargos a la lista
        },
        error: (err) => {
          console.error('Error al obtener administradores:', err);
        },
      });
  
      this.serviceAdmin.getAdministrador().subscribe({
        next: (data) => {
          this.admin = data; // Asigna los cargos a la lista
        },
        error: (err) => {
          console.error('Error al obtener administradores:', err);
        },
      });
    }
    agregar() {
      this.serviceAdmin.agregar(this.administrador).subscribe({
        next: (response) => {
         
            localStorage.setItem('identity_user', JSON.stringify(response.usuario));
            this._router.navigate(['/listaAdministrador']);
          
          // Aquí puedes manejar la respuesta, como guardar un token o redirigir al usuario
        },
        error: (err) => {
          console.error('Error en enviar datos del administrador:', err);
          // Aquí puedes manejar el error, como mostrar un mensaje al usuario
        },
      });
    }
  }