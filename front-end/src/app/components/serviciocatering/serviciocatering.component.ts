import { Component, OnInit } from '@angular/core';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { TipocateringService } from '../../services/tipocatering.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';
import { Optional } from '@angular/core';
import { of } from 'rxjs'; 
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';


@Component({
  selector: 'app-serviciocatering',
  standalone: false,
  
  templateUrl: './serviciocatering.component.html',
  styleUrl: './serviciocatering.component.css'
})
export class ServiciocateringComponent implements OnInit {
  servicio = {
    idservicio: '', 
    nombre: '',
    descripcion: '',
    idtipo: '',
    idestado: '',
  };

  tipo: any[] = [];
  estados: any[] = [];

  nuevaImagen: File | null = null;
  isLoading: boolean = false;
  esEdicion = false;

    constructor(
      
      private tipoService: TipocateringService,
      private serviceTipo: TipocateringService,
      private servCatering: ServiciocateringService,
      @Optional() private dialogRef: MatDialogRef<ServiciocateringComponent> ,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
      
      private _router:Router) {}
  
        ngOnInit():void {
          if (this.data?.servicio) {
          this.servicio= { ...this.data.servicio};   // precargar
          this.esEdicion     = true;
  }


          this.tipoService.getTipo().subscribe({
            next: (data) => {
              this.tipo = data; // Asigna los cargos a la lista
            },
            error: (err) => {
              console.error('Error al obtener los tipos:', err);
            },
          });

          this.serviceTipo.getEstados().subscribe({
            next: (data) => {
              this.estados = data; // Asigna los cargos a la lista
            },
            error: (err) => {
              console.error('Error al obtener los estados:', err);
            },
          });
      
        }

        onNewImageSelected(event: any): void {
          if (event.target.files && event.target.files.length > 0) {
            this.nuevaImagen = event.target.files[0];
            console.log('Imagen seleccionada:', this.nuevaImagen);
          }
        }

        private get esDialogo(): boolean { return !!this.dialogRef; }

        private irALista(): void { this._router.navigate(['/listaServicios']); }
        

  agregar(): void {
  // ── Validaciones mínimas ──────────────────────────
  if (!this.servicio.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">Debes ingresar el nombre del servicio.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.servicio.descripcion.trim()) {
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
  if (!this.servicio.idtipo) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Tipo obligatorio</h2>
        <p class="swal-pro-desc">Selecciona un tipo de catering.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.servicio.idestado) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Estado obligatorio</h2>
        <p class="swal-pro-desc">Selecciona un estado para el servicio.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  // ─────────────────────────────────────────────────

  this.isLoading = true; // spinner ON

  this.servCatering.agregar(this.servicio).subscribe({
    next: ({ idservicio }) => {
      // (A) si hay imagen, súbela primero
      const subir = this.nuevaImagen
        ? this.servCatering.subirImagenServicio(this.nuevaImagen, idservicio)
        : of(null);

      subir.subscribe({
        next: () => finalizaExito(),
        error: err => finalizaError('al subir la imagen', err)
      });
    },
    error: err => finalizaError('al crear el servicio', err)
  });

  /* ---------- helpers internas de este flujo ---------- */
  const finalizaExito = () => {
    this.isLoading = false;
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-check"></div>
        <h2 class="swal-pro-title">Servicio agregado</h2>
        <p class="swal-pro-desc">Se guardó correctamente.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }).then(() => {
      if (this.esDialogo) {
        this.dialogRef!.close('added');
      } else {
        this.irALista();
      }
    });
  };

  const finalizaError = (msg: string, err: any) => {
    this.isLoading = false;
    console.error(`Error ${msg}:`, err);
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Error</h2>
        <p class="swal-pro-desc">Ocurrió un error ${msg}.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
  };
}


cancelar(): void {
  this.esDialogo ? this.dialogRef!.close()
                 : this.irALista();
}

guardar(): void {
  // ── Validaciones mínimas (mismas que en agregar) ──
  if (!this.servicio.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">Debes ingresar el nombre del servicio.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.servicio.descripcion.trim()) {
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
  if (!this.servicio.idtipo) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Tipo obligatorio</h2>
        <p class="swal-pro-desc">Selecciona un tipo de catering.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.servicio.idestado) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Estado obligatorio</h2>
        <p class="swal-pro-desc">Selecciona un estado para el servicio.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  // ─────────────────────────────────────────────────

  this.isLoading = true;

  const accion$ = this.esEdicion
    ? this.servCatering.editarServicio(this.servicio)
    : this.servCatering.agregar(this.servicio);

  accion$.subscribe({
    next: (res: any) => {
      const idservicio = this.esEdicion ? this.servicio.idservicio : res.idservicio;

      const upload$ = this.nuevaImagen
        ? this.servCatering.subirImagenServicio(this.nuevaImagen, idservicio)
        : of(null);

      upload$.subscribe({
        next: () => this.finalizaExito(),
        error: err => this.finalizaError('al subir la imagen', err)
      });
    },
    error: err => this.finalizaError('al guardar el servicio', err)
  });
}

private finalizaExito(): void {
  this.isLoading = false;
  Swal.fire({
    width: 480,
    html: `
      <div class="swal-pro-check"></div>
      <h2 class="swal-pro-title">${this.esEdicion ? 'Servicio actualizado' : 'Servicio agregado'}</h2>
      <p class="swal-pro-desc">Los cambios se guardaron correctamente.</p>
    `,
    showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
    customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
  }).then(() => {
    if (this.esDialogo) {
      this.dialogRef!.close(this.esEdicion ? 'saved' : 'added');
    } else {
      this.irALista();
    }
  });
}

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
    showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
    customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
  });
}
}

