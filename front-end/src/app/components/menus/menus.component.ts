import { Component, OnInit } from '@angular/core';
import { MenusService } from '../../services/menus.service';
import { TipocateringService } from '../../services/tipocatering.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menus',
  standalone: false,
  
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.css'
})
export class MenusComponent implements OnInit {
  menu = {
    
    nombre: '', // Para almacenar el valor de la contraseña
    descripcion: '',
    precio: '',
    idtipo: '',
  };

  tipo: any[] = [];
    constructor(
      
      private tipoService: TipocateringService,
      private menuCatering: MenusService,

      
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
      this.menuCatering.agregar(this.menu).subscribe({
        next: (response) => {
         
            localStorage.setItem('identity_user', JSON.stringify(response.usuario));
            this._router.navigate(['/listaMenus']);
          
          // Aquí puedes manejar la respuesta, como guardar un token o redirigir al usuario
        },
        error: (err) => {
          console.error('Error en enviar datos del menú', err);
          // Aquí puedes manejar el error, como mostrar un mensaje al usuario
        },
      });
    }
  }


