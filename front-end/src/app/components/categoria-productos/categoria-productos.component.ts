import { Component, OnInit, Optional, Inject } from '@angular/core';
import { CategoriaProductosService } from '../../services/categoria-productos.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-categoria-productos',
  standalone: false,
  templateUrl: './categoria-productos.component.html',
  styleUrl: './categoria-productos.component.css'
})
export class CategoriaProductosComponent implements OnInit {

  cat = { idcategoria: '', categoria: '' };
  esEdicion = false;

  constructor(
    private categoriaService: CategoriaProductosService,
    private dialogRef: MatDialogRef<CategoriaProductosComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    if (this.data?.categoria) {
      this.cat = { ...this.data.categoria };
      this.esEdicion = true;
    }
  }

  cancelar(): void { this.dialogRef.close(); }

  guardar(): void {
    if (!this.cat.categoria.trim()) {
      Swal.fire({
        width: 480,
        html: `
          <div class="swal-pro-warn"></div>
          <h2 class="swal-pro-title">Nombre obligatorio</h2>
          <p class="swal-pro-desc">Debes ingresar el nombre de la categoría.</p>
        `,
        showConfirmButton: true, confirmButtonText: 'Listo',
        buttonsStyling: false, focusConfirm: true,
        customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
      });
      return;
    }

    const pet$ = this.esEdicion
      ? this.categoriaService.editarCategoria(this.cat)
      : this.categoriaService.agregar(this.cat);

    pet$.subscribe({
      next: () => {
        Swal.fire({
          width: 480,
          html: `
            <div class="swal-pro-check"></div>
            <h2 class="swal-pro-title">${this.esEdicion ? 'Categoría actualizada' : 'Categoría agregada'}</h2>
            <p class="swal-pro-desc">Los cambios se guardaron correctamente.</p>
          `,
          showConfirmButton: true, confirmButtonText: 'Listo',
          buttonsStyling: false, focusConfirm: true,
          customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
        }).then(() => {
          window.dispatchEvent(new Event('categoriasActualizadas'));
          this.dialogRef.close('saved')});
      },
      error: err => {
        console.error('Error al guardar categoría:', err);
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
