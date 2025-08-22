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
  // ── Validaciones mínimas ──────────────────────────
  if (!this.productos.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">Debes ingresar el nombre del producto.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  const stockNum = Number(this.productos.stock);
  if (isNaN(stockNum) || stockNum < 0 || !Number.isFinite(stockNum)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Stock no válido</h2>
        <p class="swal-pro-desc">Ingresa un stock válido (número ≥ 0).</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  if (!this.productos.codigoproveedor) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Proveedor obligatorio</h2>
        <p class="swal-pro-desc">Selecciona un proveedor.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  if (!this.productos.idcategoria) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Categoría obligatoria</h2>
        <p class="swal-pro-desc">Selecciona una categoría.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  if (this.productos.fecha_caducidad) {
    const f = new Date(this.productos.fecha_caducidad);
    if (isNaN(f.getTime())) {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-error"></div>
          <h2 class="swal-pro-title">Fecha no válida</h2>
          <p class="swal-pro-desc">La fecha de caducidad no tiene un formato válido.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      }); return;
    }
  }
  // ─────────────────────────────────────────────────

  this.serviceProducto.agregar(this.productos).subscribe({
    next: () => {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-check"></div>
          <h2 class="swal-pro-title">Producto agregado</h2>
          <p class="swal-pro-desc">Se guardó correctamente.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      }).then(() => {
        if (this.esDialogo) this.dialogRef!.close('added');
        else this.irALista();
      });
    },
    error: err => {
      console.error('Error al enviar producto:', err);
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-error"></div>
          <h2 class="swal-pro-title">Error</h2>
          <p class="swal-pro-desc">Ocurrió un error al agregar el producto.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
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
  // ── Validaciones mínimas (mismas que en agregar) ──
  if (!this.productos.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">Debes ingresar el nombre del producto.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  const stockNum = Number(this.productos.stock);
  if (isNaN(stockNum) || stockNum < 0 || !Number.isFinite(stockNum)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Stock no válido</h2>
        <p class="swal-pro-desc">Ingresa un stock válido (número ≥ 0).</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.productos.codigoproveedor) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Proveedor obligatorio</h2>
        <p class="swal-pro-desc">Selecciona un proveedor.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.productos.idcategoria) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Categoría obligatoria</h2>
        <p class="swal-pro-desc">Selecciona una categoría.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (this.productos.fecha_caducidad) {
    const f = new Date(this.productos.fecha_caducidad);
    if (isNaN(f.getTime())) {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-error"></div>
          <h2 class="swal-pro-title">Fecha no válida</h2>
          <p class="swal-pro-desc">La fecha de caducidad no tiene un formato válido.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      }); return;
    }
  }
  // ─────────────────────────────────────────────────

  const peticion$ = this.esEdicion
    ? this.serviceProducto.editarProducto(this.productos)
    : this.serviceProducto.agregar(this.productos);

  peticion$.subscribe({
    next: () => {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-check"></div>
          <h2 class="swal-pro-title">${this.esEdicion ? 'Producto actualizado' : 'Producto agregado'}</h2>
          <p class="swal-pro-desc">Los cambios se guardaron correctamente.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      }).then(() => {
        if (this.esDialogo) this.dialogRef!.close('saved');
        else this.irALista();
      });
    },
    error: err => {
      console.error('Error al guardar producto:', err);
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-error"></div>
          <h2 class="swal-pro-title">Error</h2>
          <p class="swal-pro-desc">Ocurrió un error al guardar.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
    }
  });
}

    
  }
