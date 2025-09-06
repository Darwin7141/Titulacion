import { Component, OnInit } from '@angular/core';
import { ProveedoresService } from '../../services/proveedores.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';
import { ValidacionesService } from '../../services/validaciones.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Optional, Inject } from '@angular/core';

@Component({
  selector: 'app-proveedores',
  standalone: false,
  
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent implements OnInit {
  proveedor = {
    codigoproveedor: '',
    ci: '', // Para almacenar el valor del nombre de usuario
    nombre: '', // Para almacenar el valor de la contraseña
    direccion: '',
    e_mail: '',
    telefono: '',
    
    
  };

  esEdicion = false;
  tipoDoc: 'CEDULA' | 'RUC' = 'CEDULA';

    constructor(
      
      private serviceProv: ProveedoresService,
        private _router:Router,
      private validaciones: ValidacionesService,
    private dialogRef: MatDialogRef<ProveedoresComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any ) {}
  
    ngOnInit():void {
      if (this.data?.prov) {
    this.proveedor = { ...this.data.prov };   // precargar
    this.esEdicion     = true;

    if (this.proveedor.ci?.length === 13) this.tipoDoc = 'RUC';
  }
    }

    soloNumeros(e: any) {
    const val = (e.target.value || '').replace(/\D/g, '');
    e.target.value = val; this.proveedor.ci = val;
  }

     private validarIdentificacionOAlertar(): boolean {
    if (!this.validaciones.validarIdentificacionEcuador(this.proveedor.ci)) {
      Swal.fire({ width:480, html:`
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Identificación no válida</h2>
        <p class="swal-pro-desc">
          ${this.tipoDoc === 'CEDULA'
            ? 'La cédula debe tener 10 dígitos válidos.'
            : 'El RUC debe tener 13 dígitos válidos.'}
        </p>`,
        showConfirmButton:true, confirmButtonText:'Listo',
        buttonsStyling:false, customClass:{ popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
      return false;
    }
    return true;
  }

    agregar() {
  if (!this.validarIdentificacionOAlertar()) return;

  if (!this.proveedor.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">El nombre es obligatorio.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  if (!this.proveedor.direccion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Dirección obligatoria</h2>
        <p class="swal-pro-desc">La dirección es obligatoria.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  if (!this.validaciones.validarEmail(this.proveedor.e_mail)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Correo no válido</h2>
        <p class="swal-pro-desc">El correo electrónico no es válido.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  if (!this.validaciones.validarTelefono(this.proveedor.telefono)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Teléfono no válido</h2>
        <p class="swal-pro-desc">El número debe tener 10 dígitos y comenzar con 0.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  // Verificaciones backend
  this.serviceProv.verificarCedula(this.proveedor.ci).subscribe((resp) => {
    if (resp.existe) {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-warn"></div>
          <h2 class="swal-pro-title">Identificación duplicada</h2>
          <p class="swal-pro-desc">Ya existe un registro con este número de Cédula o RUC</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo',
        buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      }); return;
    }

    this.serviceProv.verificarEmail(this.proveedor.e_mail).subscribe((resp) => {
      if (resp.existe) {
        Swal.fire({
          width: 480,
          html: `
            <div class="swal-pro-warn"></div>
            <h2 class="swal-pro-title">Correo duplicado</h2>
            <p class="swal-pro-desc">El correo ingresado ya se encuentra registrado.</p>
          `,
          showConfirmButton: true, confirmButtonText: 'Listo',
          buttonsStyling: false, focusConfirm: true,
          customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
        }); return;
      }

      this.serviceProv.verificarTelefono(this.proveedor.telefono).subscribe((resp) => {
        if (resp.existe) {
          Swal.fire({
            width: 480,
            html: `
              <div class="swal-pro-warn"></div>
              <h2 class="swal-pro-title">Teléfono duplicado</h2>
              <p class="swal-pro-desc">El teléfono ingresado ya se encuentra registrado.</p>
            `,
            showConfirmButton: true, confirmButtonText: 'Listo',
            buttonsStyling: false, focusConfirm: true,
            customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
          }); return;
        }

        // Agregar proveedor
        this.serviceProv.agregar(this.proveedor).subscribe({
          next: () => {
            Swal.fire({
              width: 480,
              html: `
                <div class="swal-pro-check"></div>
                <h2 class="swal-pro-title">Proveedor agregado</h2>
                <p class="swal-pro-desc">Se guardó correctamente.</p>
              `,
              showConfirmButton: true, confirmButtonText: 'Listo',
              buttonsStyling: false, focusConfirm: true,
              customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
            }).then(() => this.dialogRef.close('added'));
          },
          error: (err) => {
            console.error('Error en enviar datos del proveedor:', err);
            Swal.fire({
              width: 480,
              html: `
                <div class="swal-pro-error"></div>
                <h2 class="swal-pro-title">Error</h2>
                <p class="swal-pro-desc">Ocurrió un error al agregar el proveedor.</p>
              `,
              showConfirmButton: true, confirmButtonText: 'Listo',
              buttonsStyling: false, focusConfirm: true,
              customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
            });
          },
        });
      });
    });
  });
}

           cancelar(): void {
          this.dialogRef.close();     // simplemente cierra sin flag
        }

      guardar(): void {
  if (!this.validarIdentificacionOAlertar()) return;

  if (!this.proveedor.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">El nombre es obligatorio.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  if (!this.proveedor.direccion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Dirección obligatoria</h2>
        <p class="swal-pro-desc">La dirección es obligatoria.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  if (!this.validaciones.validarEmail(this.proveedor.e_mail)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Correo no válido</h2>
        <p class="swal-pro-desc">El correo electrónico no es válido.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  if (!this.validaciones.validarTelefono(this.proveedor.telefono)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Teléfono no válido</h2>
        <p class="swal-pro-desc">El número debe tener 10 dígitos y comenzar con 0.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo',
      buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  const peticion$ = this.esEdicion
    ? this.serviceProv.editarProveedor(this.proveedor)
    : this.serviceProv.agregar(this.proveedor);

  peticion$.subscribe({
    next: () => {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-check"></div>
          <h2 class="swal-pro-title">${this.esEdicion ? 'Proveedor actualizado' : 'Proveedor agregado'}</h2>
          <p class="swal-pro-desc">Los cambios se guardaron correctamente.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo',
        buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      }).then(() => this.dialogRef.close('saved'));
    },
    error: err => {
      console.error('Error al guardar proveedor:', err);
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