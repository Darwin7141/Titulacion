import { Component, OnInit } from '@angular/core';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { TipocateringService } from '../../services/tipocatering.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-serviciocatering',
  standalone: false,
  
  templateUrl: './serviciocatering.component.html',
  styleUrl: './serviciocatering.component.css'
})
export class ServiciocateringComponent implements OnInit {
  servicio = {
    
    nombre: '', // Para almacenar el valor de la contraseña
    descripcion: '',
    idtipo: '',
  };

  tipo: any[] = [];
    constructor(
      
      private tipoService: TipocateringService,
      private servCatering: ServiciocateringService,

      
      private _router:Router) {}
  
        ngOnInit():void {
          this.tipoService.getTipo().subscribe({
            next: (data) => {
              this.tipo = data; // Asigna los cargos a la lista
            },
            error: (err) => {
              console.error('Error al obtener los tipos:', err);
            },
          });
      
        }

    agregar() {
      this.servCatering.agregar(this.servicio).subscribe({
        next: (response) => {
         
            localStorage.setItem('identity_user', JSON.stringify(response.usuario));
            this._router.navigate(['/listaServicios']);
          
          // Aquí puedes manejar la respuesta, como guardar un token o redirigir al usuario
        },
        error: (err) => {
          console.error('Error en enviar datos del servicio', err);
          // Aquí puedes manejar el error, como mostrar un mensaje al usuario
        },
      });
    }
  }

