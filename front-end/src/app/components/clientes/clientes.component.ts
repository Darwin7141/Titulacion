import { Component, OnInit } from '@angular/core';
import { ClientesService } from '../../services/clientes.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clientes',
  standalone: false,
  
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent implements OnInit {
  clientes = {
    ci: '', // Para almacenar el valor del nombre de usuario
    nombre: '', // Para almacenar el valor de la contraseña
    direccion: '',
    e_mail: '',
    telefono: '',
    
  };
    constructor(
      
      private clienteService: ClientesService,
        private _router:Router) {}
  
    ngOnInit():void {
      
    }
    agregar() {
      this.clienteService.agregar(this.clientes).subscribe({
        next: (response) => {
         
            localStorage.setItem('identity_user', JSON.stringify(response.usuario));
            this._router.navigate(['/listaClientes']);
          
          // Aquí puedes manejar la respuesta, como guardar un token o redirigir al usuario
        },
        error: (err) => {
          console.error('Error en enviar datos del cliente:', err);
          // Aquí puedes manejar el error, como mostrar un mensaje al usuario
        },
      });
    }
  }

