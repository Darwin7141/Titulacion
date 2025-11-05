import { Component, OnInit,Optional, Inject  } from '@angular/core';
import { MenusService } from '../../services/menus.service';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';              
import Swal  from 'sweetalert2';



@Component({
  selector: 'app-menus',
  standalone: false,
  
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.css'
})
export class MenusComponent implements OnInit {
  menu = {
    idmenu: '',
    nombre: '', // Para almacenar el valor de la contraseña
    descripcion: '',
    precio: '',
    idservicio: '',
    imagen: ''
  };

  tipo: any[] = [];
  nuevaImagen: File | null = null;
  isLoading: boolean = false;
  esEdicion = false;
  previewUrl: string | ArrayBuffer | null = null;

    constructor(
      
      private servCatering: ServiciocateringService,
      public menuCatering: MenusService,
      @Optional() private dialogRef: MatDialogRef<MenusComponent>,
      @Optional() @Inject(MAT_DIALOG_DATA) private data: any,
      private _router:Router) {}

      private get esDialogo(): boolean { return !!this.dialogRef; }
    private irALista(): void { this._router.navigate(['/listaMenus']); }
  
        ngOnInit():void {

          if (this.data?.menu) {
          this.menu= { ...this.data.menu};   // precargar
          this.esEdicion     = true;
      }
          this.servCatering.getServicio().subscribe({
            next: (data) => {
              this.tipo = data; // Asigna los cargos a la lista
            },
            error: (err) => {
              console.error('Error al obtener los servicios:', err);
            },
          });
      
        }

        onNewImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      this.nuevaImagen = null;
      this.previewUrl = null;
      return;
    }

    const file = input.files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSizeMB = 4;

    if (!validTypes.includes(file.type)) {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-warn"></div>
          <h2 class="swal-pro-title">Formato no permitido</h2>
          <p class="swal-pro-desc">Usa JPG, PNG o GIF.</p>`,
        showConfirmButton: true, confirmButtonText: 'Entendido', buttonsStyling: false,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
      input.value = '';
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-warn"></div>
          <h2 class="swal-pro-title">Archivo muy grande</h2>
          <p class="swal-pro-desc">La imagen supera ${maxSizeMB} MB.</p>`,
        showConfirmButton: true, confirmButtonText: 'Ok', buttonsStyling: false,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
      input.value = '';
      return;
    }

    this.nuevaImagen = file;

    const reader = new FileReader();
    reader.onload = () => this.previewUrl = reader.result;
    reader.readAsDataURL(file);
  }

  onPrecioChange(value: any): void {
  const num = Number(value);
  if (Number.isFinite(num) && num < 0) {
    this.menu.precio = '';        // limpiar el campo
    this.alertaPrecioNegativo();  // mostrar tu SweetAlert
  }
}

  private alertaPrecioNegativo(): void {
  Swal.fire({
    width: 480,
    html: `
      <div class="swal-pro-error"></div>
      <h2 class="swal-pro-title">Precio no válido</h2>
      <p class="swal-pro-desc">No se admiten precios negativos. Ingrese un valor mayor a cero.</p>
    `,
    showConfirmButton: true,
    confirmButtonText: 'Entendido',
    buttonsStyling: false,
    customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
  });
}
        

         agregar(): void {
  // ── Validaciones mínimas ──────────────────────────
  if (!this.menu.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">Debes ingresar el nombre del menú.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.menu.descripcion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Descripción obligatoria</h2>
        <p class="swal-pro-desc">Debes ingresar una descripción.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  const precioNum = Number(this.menu.precio);
if (isNaN(precioNum) || !Number.isFinite(precioNum)) {
  Swal.fire({
    width: 480,
    html: `
      <div class="swal-pro-error"></div>
      <h2 class="swal-pro-title">Precio no válido</h2>
      <p class="swal-pro-desc">Ingresa un precio válido (número).</p>
    `,
    showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
    customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
  }); 
  return;
}
if (precioNum < 0) {
  this.alertaPrecioNegativo(); 
  return;
}

  if (!this.menu.idservicio) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Servicio obligatorio</h2>
        <p class="swal-pro-desc">Selecciona el servicio al que pertenece el menú.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  // ─────────────────────────────────────────────────

  this.isLoading = true;

  this.menuCatering.agregar(this.menu).subscribe({
      next: ({ idmenu }) => {
        const subir$ = this.nuevaImagen
          ? this.menuCatering.subirImagenServicio(this.nuevaImagen, idmenu)
          : of(null);

        subir$.subscribe({
          next: (up) => {
            if (up?.fotografia?.imagen) this.menu.imagen = up.fotografia.imagen;
            this.finalizaExito();
          },
          error: err => this.finalizaError('al subir la imagen', err),
        });
      },
      error: err => this.finalizaError('al crear el menú', err),
    });
}


  /* ---------------- cancelar ---------------- */
  cancelar(): void {
    this.esDialogo ? this.dialogRef!.close()
                   : this.irALista();
  }

  /* ---------------- helpers privados ---------------- */
  

  private finalizaError(msg: string, err: any): void {
  this.isLoading = false;
  console.error(`Error ${msg}:`, err);
  Swal.fire({
    width: 480,
    html: `
      <div class="swal-pro-error"></div>
      <h2 class="swal-pro-title">Error</h2>
      <p class="swal-pro-desc">Ocurrió un error ${msg}.</p>
    `,
    showConfirmButton: true, confirmButtonText: 'Listo',
    buttonsStyling: false, focusConfirm: true,
    customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
  });
}

  guardar(): void {
  // ── Validaciones mínimas ──
  if (!this.menu.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">Debes ingresar el nombre del menú.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.menu.descripcion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Descripción obligatoria</h2>
        <p class="swal-pro-desc">Debes ingresar una descripción.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  const precioNum = Number(this.menu.precio);
if (isNaN(precioNum) || !Number.isFinite(precioNum)) {
  Swal.fire({
    width: 480,
    html: `
      <div class="swal-pro-error"></div>
      <h2 class="swal-pro-title">Precio no válido</h2>
      <p class="swal-pro-desc">Ingresa un precio válido (número).</p>
    `,
    showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
    customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
  }); 
  return;
}
if (precioNum < 0) {
  this.alertaPrecioNegativo(); 
  return;
}

  if (!this.menu.idservicio) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Servicio obligatorio</h2>
        <p class="swal-pro-desc">Selecciona el servicio al que pertenece el menú.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  // ─────────────────────────

  this.isLoading = true;

  const accion$ = this.esEdicion
    ? this.menuCatering.editarMenu(this.menu)
    : this.menuCatering.agregar(this.menu);

  accion$.subscribe({
    next: (res: any) => {
      const idmenu = this.esEdicion ? this.menu.idmenu : res.idmenu;
      const upload$ = this.nuevaImagen
        ? this.menuCatering.subirImagenServicio(this.nuevaImagen, idmenu)
        : of(null);

      upload$.subscribe({
          next: (up) => {
            if (up?.fotografia?.imagen) this.menu.imagen = up.fotografia.imagen;
            this.finalizaExito();
          },
          error: err => this.finalizaError('al subir la imagen', err),
        });
      },
      error: err => this.finalizaError('al guardar el menú', err),
    });
  }


private finalizaExito(): void {
  this.isLoading = false;
  Swal.fire({
    width: 480,
    html: `
      <div class="swal-pro-check"></div>
      <h2 class="swal-pro-title">${this.esEdicion ? 'Menú actualizado' : 'Menú agregado'}</h2>
      <p class="swal-pro-desc">Los cambios se guardaron correctamente.</p>
    `,
    showConfirmButton: true, confirmButtonText: 'Listo',
    buttonsStyling: false, focusConfirm: true,
    customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
  }).then(() => {
    if (this.esDialogo) this.dialogRef!.close(this.esEdicion ? 'saved' : 'added');
    else this.irALista();
  });
}

}
      




