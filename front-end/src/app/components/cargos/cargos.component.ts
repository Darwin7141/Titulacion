import { Component, OnInit} from '@angular/core';
import { CargosService } from '../../services/cargos.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cargos',
  standalone: false,
  
  templateUrl: './cargos.component.html',
  styleUrl: './cargos.component.css'
})
export class CargosComponent implements OnInit {
  cargos = {
     // Para almacenar el valor del nombre de usuario
    nombrecargo: '', // Para almacenar el valor de la contraseña
    descripcion: '',
    
  };
    constructor(
      
      private cargoService: CargosService,
        private _router:Router) {}
  
    ngOnInit():void {
      
    }
    agregar() {
      this.cargoService.agregar(this.cargos).subscribe({
        next: (response) => {
         
            localStorage.setItem('identity_user', JSON.stringify(response.usuario));
            this._router.navigate(['/listaCargos']);
          
          // Aquí puedes manejar la respuesta, como guardar un token o redirigir al usuario
        },
        error: (err) => {
          console.error('Error en enviar datos del cargo:', err);
          // Aquí puedes manejar el error, como mostrar un mensaje al usuario
        },
      });
    }
  }
