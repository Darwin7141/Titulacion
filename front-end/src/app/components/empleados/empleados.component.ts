
import { Component, OnInit } from '@angular/core';
import { EmpleadosService } from '../../services/empleados.service';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ValidacionesService } from '../../services/validaciones.service';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Optional, Inject } from '@angular/core';

@Component({
  selector: 'app-empleados',
  standalone: false,
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css'
})
export class EmpleadosComponent implements OnInit {
  empleado = {
    codigoempleado: '',
    ci: '', // Para almacenar el valor del nombre de usuario
    nombre: '', // Para almacenar el valor de la contraseña
    direccion: '',
    e_mail: '',
    telefono: '',
    idcargo: '',
    
    
  };

  empleados: any[]=[];

  cargo: any[] = [];
  esEdicion = false;

  constructor(
    
    private _serviceEmpleado: EmpleadosService,
    private _router:Router,
    private validaciones: ValidacionesService,
    private dialogRef: MatDialogRef<EmpleadosComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit():void {
     if (this.data?.emp) {
    this.empleado= { ...this.data.emp };   // precargar
    this.esEdicion     = true;
  }

    this._serviceEmpleado.getCargosEmpleados().subscribe({
      next: (data) => {
        this.cargo = data; // Asigna los cargos a la lista
      },
      error: (err) => {
        console.error('Error al obtener cargos:', err);
      },
    });

    this._serviceEmpleado.getEmpleados().subscribe({
      next: (data) => {
        this.empleados = data; // Asigna los cargos a la lista
      },
      error: (err) => {
        console.error('Error al obtener cargos:', err);
      },
    });
  }
 agregar() {
  if (!this.validaciones.validarCedulaEcuador(this.empleado.ci)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Cédula no válida</h2>
        <p class="swal-pro-desc">La cédula ingresada no es válida.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.empleado.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">El nombre es obligatorio.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.empleado.direccion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Dirección obligatoria</h2>
        <p class="swal-pro-desc">La dirección es obligatoria.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.validaciones.validarEmail(this.empleado.e_mail)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Correo no válido</h2>
        <p class="swal-pro-desc">El correo electrónico no es válido.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.validaciones.validarTelefono(this.empleado.telefono)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Teléfono no válido</h2>
        <p class="swal-pro-desc">El número debe tener 10 dígitos y comenzar con 0.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.empleado.idcargo) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Cargo obligatorio</h2>
        <p class="swal-pro-desc">Debes seleccionar un cargo.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  // Verificaciones backend
  this._serviceEmpleado.verificarCedula(this.empleado.ci).subscribe((resp) => {
    if (resp.existe) {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-warn"></div>
          <h2 class="swal-pro-title">Cédula duplicada</h2>
          <p class="swal-pro-desc">La cédula ya ingresada ya se encuentra registrada.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      }); return;
    }

    this._serviceEmpleado.verificarEmail(this.empleado.e_mail).subscribe((resp) => {
      if (resp.existe) {
        Swal.fire({
          width: 480,
          html: `
            <div class="swal-pro-warn"></div>
            <h2 class="swal-pro-title">Correo duplicado</h2>
            <p class="swal-pro-desc">El correo ingresado ya se encuentra registrado.</p>
          `,
          showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
          customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
        }); return;
      }

      this._serviceEmpleado.verificarTelefono(this.empleado.telefono).subscribe((resp) => {
        if (resp.existe) {
          Swal.fire({
            width: 480,
            html: `
              <div class="swal-pro-warn"></div>
              <h2 class="swal-pro-title">Teléfono duplicado</h2>
              <p class="swal-pro-desc">El teléfono ingresado ya existe en la base de datos</p>
            `,
            showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
            customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
          }); return;
        }

        // Agregar empleado
        this._serviceEmpleado.agregar(this.empleado).subscribe({
          next: () => {
            Swal.fire({
              width: 480,
              html: `
                <div class="swal-pro-check"></div>
                <h2 class="swal-pro-title">Empleado agregado</h2>
                <p class="swal-pro-desc">Se guardó correctamente.</p>
              `,
              showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
              customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
            }).then(() => this.dialogRef.close('added'));
          },
          error: (err) => {
            console.error('Error en enviar datos del empleado:', err);
            Swal.fire({
              width: 480,
              html: `
                <div class="swal-pro-error"></div>
                <h2 class="swal-pro-title">Error</h2>
                <p class="swal-pro-desc">Ocurrió un error al agregar el empleado.</p>
              `,
              showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
              customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
            });
          }
        });
      });
    });
  });
}

  cancelar(): void {
    this.dialogRef.close();     // simplemente cierra sin flag
  }

  guardar(): void {
  if (!this.validaciones.validarCedulaEcuador(this.empleado.ci)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Cédula no válida</h2>
        <p class="swal-pro-desc">La cédula ingresada no es válida.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.empleado.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">El nombre es obligatorio.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.empleado.direccion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Dirección obligatoria</h2>
        <p class="swal-pro-desc">La dirección es obligatoria.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.validaciones.validarEmail(this.empleado.e_mail)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Correo no válido</h2>
        <p class="swal-pro-desc">El correo electrónico no es válido.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.validaciones.validarTelefono(this.empleado.telefono)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Teléfono no válido</h2>
        <p class="swal-pro-desc">El número debe tener 10 dígitos y comenzar con 0.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }
  if (!this.empleado.idcargo) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Cargo obligatorio</h2>
        <p class="swal-pro-desc">Debes seleccionar un cargo.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }); return;
  }

  const peticion$ = this.esEdicion
    ? this._serviceEmpleado.editarEmpleado(this.empleado)
    : this._serviceEmpleado.agregar(this.empleado);

  peticion$.subscribe({
  next: () => {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-check"></div>
        <h2 class="swal-pro-title">${this.esEdicion ? 'Empleado actualizado' : 'Empleado agregado'}</h2>
        <p class="swal-pro-desc">Los cambios se guardaron correctamente.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    }).then(() => this.dialogRef.close('saved'));
  },
  error: (err) => {
    if (err?.status === 409) {
      const code = err.error?.code;
      const map: any = {
        'DUP_CI':    { title: 'Cédula duplicada',   text: 'La cédula ingresada ya se encuentra registrada.' },
        'DUP_EMAIL': { title: 'Correo duplicado',   text: 'El correo ingresado ya se encuentra registrado.' },
        'DUP_TEL':   { title: 'Teléfono duplicado', text: 'El teléfono ingresado ya se encuentra registrado.' }
      };
      const msg = map[code] ?? { title: 'Dato duplicado', text: 'Ya existe un registro con esos datos.' };

      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-warn"></div>
          <h2 class="swal-pro-title">${msg.title}</h2>
          <p class="swal-pro-desc">${msg.text}</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
      return;
    }

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