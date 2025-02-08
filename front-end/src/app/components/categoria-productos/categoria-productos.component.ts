import { Component, OnInit} from '@angular/core';
import { CategoriaProductosService } from '../../services/categoria-productos.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-categoria-productos',
  standalone: false,
  
  templateUrl: './categoria-productos.component.html',
  styleUrl: './categoria-productos.component.css'
})
export class CategoriaProductosComponent {
cat = {
     // Para almacenar el valor del nombre de usuario
    categoria: '', // Para almacenar el valor de la contraseña
  
    
  };
    constructor(
      
      private categoriaService: CategoriaProductosService,
        private _router:Router) {}
  
    ngOnInit():void {
      
    }
    agregar() {
      this.categoriaService.agregar(this.cat).subscribe({
        next: (response) => {
         
            localStorage.setItem('identity_user', JSON.stringify(response.usuario));
            this._router.navigate(['/listaCategorias']);
          
          // Aquí puedes manejar la respuesta, como guardar un token o redirigir al usuario
        },
        error: (err) => {
          console.error('Error en enviar datos de la categoría:', err);
          // Aquí puedes manejar el error, como mostrar un mensaje al usuario
        },
      });
    }
  }
