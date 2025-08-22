import { Component, OnInit} from '@angular/core';
import { TipocateringService } from '../../services/tipocatering.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Optional, Inject } from '@angular/core';

@Component({
  selector: 'app-tipocatering',
  standalone: false,
  
  templateUrl: './tipocatering.component.html',
  styleUrl: './tipocatering.component.css'
})
export class TipocateringComponent implements OnInit {
  tipo = {
    idtipo: '',
    nombre: '', // Para almacenar el valor de la contraseña
    descripcion: '',
    idestado: '',
  };

  estados: any[] = [];
  esEdicion = false;

    constructor(
      
      private serviceTipo: TipocateringService,
      private dialogRef: MatDialogRef<TipocateringComponent> ,
      private _router:Router,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any) {}
  
        ngOnInit():void {
          if (this.data?.tipo) {
    this.tipo = { ...this.data.tipo };   // precargar
    this.esEdicion     = true;
  }
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
  // Validaciones mínimas
  if (!this.tipo.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">Debes ingresar el nombre del tipo de catering.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.tipo.descripcion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Descripción obligatoria</h2>
        <p class="swal-pro-desc">Debes ingresar una descripción.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  

  this.serviceTipo.agregar(this.tipo).subscribe({
    next: () => {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-check"></div>
          <h2 class="swal-pro-title">Tipo de catering agregado</h2>
          <p class="swal-pro-desc">Se guardó correctamente.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo',
        buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      }).then(() => this.dialogRef.close('added'));
    },
    error: (err) => {
      console.error('Error en enviar datos del tipo de catering:', err);
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-error"></div>
          <h2 class="swal-pro-title">Error</h2>
          <p class="swal-pro-desc">Ocurrió un error al agregar el tipo de catering.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo',
        buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
    },
  });
}

     cancelar(): void {
    this.dialogRef.close();     // simplemente cierra sin flag
  }


  guardar(): void {
  // Validaciones mínimas
  if (!this.tipo.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">Debes ingresar el nombre del tipo de catering.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.tipo.descripcion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Descripción obligatoria</h2>
        <p class="swal-pro-desc">Debes ingresar una descripción.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  

  const peticion$ = this.esEdicion
    ? this.serviceTipo.editarTipo(this.tipo)
    : this.serviceTipo.agregar(this.tipo);

  peticion$.subscribe({
    next: () => {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-check"></div>
          <h2 class="swal-pro-title">${this.esEdicion ? 'Tipo de catering actualizado' : 'Tipo de catering agregado'}</h2>
          <p class="swal-pro-desc">Los cambios se guardaron correctamente.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo',
        buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      }).then(() => this.dialogRef.close('saved'));
    },
    error: err => {
      console.error('Error al guardar el tipo:', err);
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-error"></div>
          <h2 class="swal-pro-title">Error</h2>
          <p class="swal-pro-desc">Ocurrió un error al guardar.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo',
        buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
    }
  });
}
  }
