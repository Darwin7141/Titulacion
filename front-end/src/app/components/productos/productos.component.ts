import { Component, OnInit } from '@angular/core';
import { ProveedoresService } from '../../services/proveedores.service';
import { ProductosService } from '../../services/productos.service';
import { CategoriaProductosService } from '../../services/categoria-productos.service';
import { ActivatedRoute, Router } from '@angular/router';

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
    idcategoria: '',
   
  };
  categoriaFijaId: string | null = null;
  prov: any[] = [];
  cat: any[] = [];
    constructor(
      private route: ActivatedRoute,
      private serviceProducto: ProductosService,
      private serviceProveedor: ProveedoresService,
      private categoriaService: CategoriaProductosService,
      private _router:Router) {}
  
      ngOnInit(): void {
        // Leer parámetro de la ruta (idCategoria)
        this.categoriaFijaId = this.route.snapshot.paramMap.get('idCategoria');
    
        // Cargar proveedores
        this.serviceProveedor.getProveedor().subscribe({
          next: (data) => {
            this.prov = data;
          },
          error: (err) => {
            console.error('Error al obtener proveedores:', err);
          },
        });
    
        // Cargar categorías (solo si no tenemos la categoría fija)
        if (!this.categoriaFijaId) {
          this.categoriaService.getCategoria().subscribe({
            next: (data) => {
              this.cat = data;
            },
            error: (err) => {
              console.error('Error al obtener categorias', err);
            },
          });
        } else {
          // Si tenemos idCategoria en la URL, setearla en el objeto de producto
          this.productos.idcategoria = this.categoriaFijaId;
        }
      }
    

      agregar() {
        // Si no hay categoría fija, se asume que el usuario la selecciona en el formulario
        // Si sí hay categoría fija, ya la tenemos en this.productos.categoria
        this.serviceProducto.agregar(this.productos).subscribe({
          next: (response) => {
            // Luego de crear, navegar a la lista correspondiente
            if (this.categoriaFijaId) {
              // Redirigimos a la lista de esa categoría
              this._router.navigate(['/listaProductos/categoria', this.categoriaFijaId]);
            } else {
              // Redirigimos a la lista general
              this._router.navigate(['/listaProductos']);
            }
          },
          error: (err) => {
            console.error('Error al enviar datos del producto:', err);
            // Manejo de error
          },
        });
      }

      cancelar() {
        // Si hay una categoría fija, regresa a esa categoría
        if (this.categoriaFijaId) {
          this._router.navigate(['/listaProductos/categoria', this.categoriaFijaId]);
        } else {
          // De lo contrario, lista general
          this._router.navigate(['/listaProductos']);
        }
      }
    
  }
