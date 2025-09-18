import { Component, OnInit } from '@angular/core';
import { ClientesService } from '../../services/clientes.service';
import { ValidacionesService } from '../../services/validaciones.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { Optional, Inject } from '@angular/core';

@Component({
  selector: 'app-clientes',
  standalone: false,
  
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css'
})
export class ClientesComponent implements OnInit {
  clientes = {
    codigocliente: '',
    ci: '', // Para almacenar el valor del nombre de usuario
    nombre: '', // Para almacenar el valor de la contraseña
    direccion: '',
    e_mail: '',
    telefono: '',
    contrasenia: '',
    
    
  };

  esEdicion = false;
    constructor(
      
      private clienteService: ClientesService,
      private validaciones: ValidacionesService,
        private _router:Router,
      private dialogRef: MatDialogRef<ClientesComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any ) {}
  
    ngOnInit():void {
      if (this.data?.cliente) {
    this.clientes = { ...this.data.cliente };   // precargar
    console.log('Cliente recibido →', this.clientes);
    this.esEdicion     = true;
  }
      
    }
  agregar() {
  if (!this.validaciones.validarCedulaEcuador(this.clientes.ci)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Cédula no válida</h2>
        <p class="swal-pro-desc">La cédula ingresada no es válida.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.clientes.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">El nombre es obligatorio.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.clientes.direccion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Dirección obligatoria</h2>
        <p class="swal-pro-desc">La dirección es obligatoria.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.validaciones.validarEmail(this.clientes.e_mail)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Correo no válido</h2>
        <p class="swal-pro-desc">El correo electrónico no es válido.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.validaciones.validarTelefono(this.clientes.telefono)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Teléfono no válido</h2>
        <p class="swal-pro-desc">El número debe tener 10 dígitos y comenzar con 0.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  // Verificación en backend
  this.clienteService.verificarCedula(this.clientes.ci).subscribe((resp) => {
    if (resp.existe) {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-warn"></div>
          <h2 class="swal-pro-title">Cédula duplicada</h2>
          <p class="swal-pro-desc">La cédula ingresada ya se encuentra registrada.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
      return;
    }

    this.clienteService.verificarEmail(this.clientes.e_mail).subscribe((resp) => {
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
        });
        return;
      }

      this.clienteService.verificarTelefono(this.clientes.telefono).subscribe((resp) => {
        if (resp.existe) {
          Swal.fire({
            width: 480,
            html: `
              <div class="swal-pro-warn"></div>
              <h2 class="swal-pro-title">Teléfono duplicado</h2>
              <p class="swal-pro-desc">El teléfono ingreesado ya se encuentra registrado.</p>
            `,
            showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
            customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
          });
          return;
        }

        // Agregar cliente
        this.clienteService.agregar(this.clientes).subscribe({
          next: () => {
            Swal.fire({
              width: 480,
              html: `
                <div class="swal-pro-check"></div>
                <h2 class="swal-pro-title">Cliente agregado</h2>
                <p class="swal-pro-desc">Se guardó correctamente.</p>
              `,
              showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
              customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
            }).then(() => this.dialogRef.close('added'));
          },
          error: (err) => {
            console.error('Error en enviar datos del cliente:', err);
            Swal.fire({
              width: 480,
              html: `
                <div class="swal-pro-error"></div>
                <h2 class="swal-pro-title">Error</h2>
                <p class="swal-pro-desc">Ocurrió un error al agregar el cliente.</p>
              `,
              showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
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
  if (!this.validaciones.validarCedulaEcuador(this.clientes.ci)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Cédula no válida</h2>
        <p class="swal-pro-desc">La cédula ingresada no es válida.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.clientes.nombre.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Nombre obligatorio</h2>
        <p class="swal-pro-desc">El nombre es obligatorio.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.clientes.direccion.trim()) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Dirección obligatoria</h2>
        <p class="swal-pro-desc">La dirección es obligatoria.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.validaciones.validarEmail(this.clientes.e_mail)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Correo no válido</h2>
        <p class="swal-pro-desc">El correo electrónico no es válido.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  if (!this.validaciones.validarTelefono(this.clientes.telefono)) {
    Swal.fire({
      width: 480,
      html: `
        <div class="swal-pro-error"></div>
        <h2 class="swal-pro-title">Teléfono no válido</h2>
        <p class="swal-pro-desc">El número debe tener 10 dígitos y comenzar con 0.</p>
      `,
      showConfirmButton: true, confirmButtonText: 'Listo', buttonsStyling: false, focusConfirm: true,
      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
    });
    return;
  }

  const peticion$ = this.esEdicion
    ? this.clienteService.editarCliente(this.clientes)
    : this.clienteService.agregar(this.clientes);

  peticion$.subscribe({
    next: () => {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-check"></div>
          <h2 class="swal-pro-title">${this.esEdicion ? 'Cliente actualizado' : 'Cliente agregado'}</h2>
          <p class="swal-pro-desc">Los cambios se guardaron correctamente.</p>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Listo',
        buttonsStyling: false,
        focusConfirm: true,
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
          showConfirmButton: true,
          confirmButtonText: 'Listo',
          buttonsStyling: false,
          focusConfirm: true,
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
        showConfirmButton: true,
        confirmButtonText: 'Listo',
        buttonsStyling: false,
        focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
    }
  });
}


   }