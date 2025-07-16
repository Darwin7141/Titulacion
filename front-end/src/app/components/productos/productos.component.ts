import { Component, OnInit } from '@angular/core';
import { ProveedoresService } from '../../services/proveedores.service';
import { ProductosService } from '../../services/productos.service';
import { CategoriaProductosService } from '../../services/categoria-productos.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Optional, Inject } from '@angular/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-productos',
  standalone: false,
  
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {
  productos = {
    idproducto: '',
    nombre: '', // Para almacenar el valor de la contraseña
    stock: '',
    codigoproveedor: '',
    idcategoria: '',
    id_admin:  '',
    fecha_caducidad: '',
   
  };
  categoriaFijaId: string | null = null;
  prov: any[] = [];
  cat: any[] = [];
  esEdicion = false;

    constructor(
      private route: ActivatedRoute,
      private serviceProducto: ProductosService,
      private serviceProveedor: ProveedoresService,
      private categoriaService: CategoriaProductosService,
      private _router:Router,
    @Optional() private dialogRef: MatDialogRef<ProductosComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) private data: any) {}
  
      ngOnInit(): void {
      if (this.data?.prod) {
    this.productos = { ...this.data.prod };   // precargar
    this.esEdicion     = true;
  }


      this.categoriaFijaId =
      this.data?.idCategoria ??
      this.route.snapshot.paramMap.get('idCategoria');
    
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

      private get esDialogo(): boolean { return !!this.dialogRef; }
    

      agregar(): void {
  this.serviceProducto.agregar(this.productos).subscribe({
    next: () => {
      Swal.fire({ icon:'success', title:'Éxito', text:'Producto agregado correctamente.' })
        .then(() => {
          if (this.esDialogo) {
            this.dialogRef!.close('added');        // notifica a la lista
          } else {
            this.irALista();                       // navegación normal
          }
        });
    },
    error: err => {
      console.error('Error al enviar producto:', err);
      Swal.fire({ icon:'error', title:'Error', text:'Ocurrió un error al agregar el producto.' });
    }
  });
}

  private irALista(): void {
  if (this.categoriaFijaId) {
    this._router.navigate(['/listaProductos/categoria', this.categoriaFijaId]);
  } else {
    this._router.navigate(['/listaProductos']);
  }
}

     cancelar(): void {
  if (this.esDialogo) {
    this.dialogRef!.close();
  } else {
    this.irALista();
  }
}

guardar(): void {
  
  const peticion$ = this.esEdicion
      ? this.serviceProducto.editarProducto(this.productos)
      : this.serviceProducto.agregar(this.productos);

  peticion$.subscribe({
    next : () => {
      Swal.fire({
        icon : 'success',
        title: 'Éxito',
        text : this.esEdicion
               ? 'Producto actualizado correctamente.'
               : 'Producto agregado correctamente.'
      }).then(() => this.dialogRef.close('saved'));
    },
    error: err => {
      console.error('Error al guardar producto:', err);
      Swal.fire({ icon:'error', title:'Error', text:'Ocurrió un error al guardar.' });
    }
  });

      }
    
  }
