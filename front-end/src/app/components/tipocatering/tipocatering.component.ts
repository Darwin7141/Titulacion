import { Component, OnInit} from '@angular/core';
import { TipocateringService } from '../../services/tipocatering.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tipocatering',
  standalone: false,
  
  templateUrl: './tipocatering.component.html',
  styleUrl: './tipocatering.component.css'
})
export class TipocateringComponent implements OnInit {
  tipo = {
    
    nombre: '', // Para almacenar el valor de la contraseña
    descripcion: '',
    idestado: '',
  };

  estados: any[] = [];
    constructor(
      
      private serviceTipo: TipocateringService,
      
      private _router:Router) {}
  
        ngOnInit():void {
          this.serviceTipo.getEstados().subscribe({
            next: (data) => {
              this.estados = data; // Asigna los cargos a la lista
            },
            error: (err) => {
              console.error('Error al obtener los estados:', err);
            },
          });
      
        }

    agregar() {
      this.serviceTipo.agregar(this.tipo).subscribe({
        next: (response) => {
         
            localStorage.setItem('identity_user', JSON.stringify(response.usuario));
            this._router.navigate(['/listaTipos']);
          
          // Aquí puedes manejar la respuesta, como guardar un token o redirigir al usuario
        },
        error: (err) => {
          console.error('Error en enviar datos del tipo de catering:', err);
          // Aquí puedes manejar el error, como mostrar un mensaje al usuario
        },
      });
    }
  }
