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
      this.cargoService.agregar(this.cargos).subscribe({
              next: () => {
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Cargo agregado correctamente.' })
                    .then(() => this.dialogRef.close('added'));   
              },
        error: (err) => {
          console.error('Error en enviar datos del cargo:', err);
          
        },
      });
    }
    cancelar(): void {
    this.dialogRef.close();     
  }

guardar(): void {

  const peticion$ = this.esEdicion
      ? this.cargoService.editarCargo(this.cargos)
      : this.cargoService.agregar(this.cargos);

  peticion$.subscribe({
    next : () => {
      Swal.fire({
        icon : 'success',
        title: 'Éxito',
        text : this.esEdicion
               ? 'Cargo actualizado correctamente.'
               : 'Cargo agregado correctamente.'
      }).then(() => this.dialogRef.close('saved'));
    },
    error: err => {
      console.error('Error al guardar el cargo:', err);
      Swal.fire({ icon:'error', title:'Error', text:'Ocurrió un error al guardar.' });
    }
  });

  }
  }
