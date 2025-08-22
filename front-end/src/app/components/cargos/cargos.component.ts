import { Component, OnInit} from '@angular/core';
import { CargosService } from '../../services/cargos.service';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Optional, Inject } from '@angular/core';

@Component({
  selector: 'app-cargos',
  standalone: false,
  
  templateUrl: './cargos.component.html',
  styleUrl: './cargos.component.css'
})
export class CargosComponent implements OnInit {
  cargos = {
    idcargo: '',
    nombrecargo: '', 
    descripcion: '',
    
  };

  esEdicion = false;
    constructor(
      
      private cargoService: CargosService,
        private _router:Router,
      private dialogRef: MatDialogRef<CargosComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any ) {}
  
    ngOnInit():void {

      if (this.data?.cargo) {
    this.cargos= { ...this.data.cargo };   // precargar
    this.esEdicion     = true;
  }
      
    }
    agregar() {
  // Validaciones mínimas
  if (!this.cargos.nombrecargo.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre de cargo obligatorio</h2>
        <p class="swal-pro-desc">Debes ingresar el nombre del cargo.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }
  if (!this.cargos.descripcion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Descripción obligatoria</h2>
        <p class="swal-pro-desc">Debes ingresar la descripción del cargo.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  this.cargoService.agregar(this.cargos).subscribe({
    next: () => {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-check"></div>
          <h2 class="swal-pro-title">Cargo agregado</h2>
          <p class="swal-pro-desc">Se guardó correctamente.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo',
        buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      }).then(() => this.dialogRef.close('added'));
    },
    error: (err) => {
      console.error('Error en enviar datos del cargo:', err);
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-error"></div>
          <h2 class="swal-pro-title">Error</h2>
          <p class="swal-pro-desc">Ocurrió un error al agregar el cargo.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo',
        buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
    },
  });
}

    cancelar(): void {
    this.dialogRef.close();     
  }

guardar(): void {
  // Validaciones mínimas
  if (!this.cargos.nombrecargo.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre de cargo obligatorio</h2>
        <p class="swal-pro-desc">Debes ingresar el nombre del cargo.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }
  if (!this.cargos.descripcion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Descripción obligatoria</h2>
        <p class="swal-pro-desc">Debes ingresar la descripción del cargo.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  const peticion$ = this.esEdicion
    ? this.cargoService.editarCargo(this.cargos)
    : this.cargoService.agregar(this.cargos);

  peticion$.subscribe({
    next: () => {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-check"></div>
          <h2 class="swal-pro-title">${this.esEdicion ? 'Cargo actualizado' : 'Cargo agregado'}</h2>
          <p class="swal-pro-desc">Los cambios se guardaron correctamente.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo',
        buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      }).then(() => this.dialogRef.close('saved'));
    },
    error: err => {
      console.error('Error al guardar el cargo:', err);
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
