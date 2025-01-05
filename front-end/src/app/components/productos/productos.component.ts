import { Component, OnInit } from '@angular/core';
import { ProveedoresService } from '../../services/proveedores.service';
import { ProductosService } from '../../services/productos.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-productos',
  standalone: false,
  
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {
  productos = {
    
    nombre: '', // Para almacenar el valor de la contraseña
    stock: '',
    codigoproveedor: '',
  };

  prov: any[] = [];
    constructor(
      
      private serviceProducto: ProductosService,
      private serviceProveedor: ProveedoresService,
      private _router:Router) {}
  
        ngOnInit():void {
          this.serviceProveedor.getProveedor().subscribe({
            next: (data) => {
              this.prov = data; // Asigna los cargos a la lista
            },
            error: (err) => {
              console.error('Error al obtener proveedores:', err);
            },
          });
      
          this.serviceProveedor.getProveedor().subscribe({
            next: (data) => {
              this.prov = data; // Asigna los cargos a la lista
            },
            error: (err) => {
              console.error('Error al obtener los proveedores', err);
            },
          });
        }

    agregar() {
      this.serviceProducto.agregar(this.productos).subscribe({
        next: (response) => {
         
            localStorage.setItem('identity_user', JSON.stringify(response.usuario));
            this._router.navigate(['/listaProductos']);
          
          // Aquí puedes manejar la respuesta, como guardar un token o redirigir al usuario
        },
        error: (err) => {
          console.error('Error en enviar datos del producto:', err);
          // Aquí puedes manejar el error, como mostrar un mensaje al usuario
        },
      });
    }
  }
