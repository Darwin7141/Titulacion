import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { TipocateringService } from '../../services/tipocatering.service';
import { PageEvent } from '@angular/material/paginator';
import { jsPDF } from 'jspdf';
import autoTable, { CellHookData }  from 'jspdf-autotable';
import { MatDialog } from '@angular/material/dialog';
import { ServiciocateringComponent } from '../serviciocatering/serviciocatering.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-listarservicio',
  standalone: false,
  
  templateUrl: './listarservicio.component.html',
  styleUrl: './listarservicio.component.css'
})
export class ListarservicioComponent implements OnInit {
  servicio: any[] = [];
  servFiltrados: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  servSeleccionado: any = null;
  tipo: any[] = [];
  estados: any[] = [];


   @Output() cerrar = new EventEmitter<void>();

 
volver(): void {
    this.cerrar.emit();
  }

  
    /* paginación */
    displayedServicios: any[] = [];
    pageSize            = 5;
    pageIndex           = 0;
  
    
      

  isLoading: boolean = false;

  constructor(
    private cateringService: ServiciocateringService,
    private serviceTipo: TipocateringService,
    private tipoCatering: TipocateringService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.tipoCatering.getTipo().subscribe({
      next: (data) => {
        this.tipo = data; // Asigna los cargos a la lista
      },
      error: (err) => {
        console.error('Error al obtener cargos:', err);
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
   
    this.obtenerServicios();
    
  }

 obtenerServicios(): void {
  this.cateringService.getServicio().subscribe({
    next: (data) => {
      this.servicio = data.map(serv => ({
        ...serv,
        fotografiaUrl: serv?.imagen
          ? this.cateringService.getFotoUrl(serv.imagen, true) // prueba con thumb
          : null
      }));
      this.servFiltrados = this.servicio;
      this.updatePagedData();
    },
    error: (err) => console.error('Error al obtener los servicios:', err),
  });
}
  

  

  buscarServicios(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.servFiltrados = this.servicio; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.servFiltrados = this.servicio.filter((servicio) =>
        servicio.nombre.toLowerCase().includes(searchTermLower) ||
        servicio.idservicio.toLowerCase().includes(searchTermLower) // Filtra también por código
      );
    }

    this.pageIndex = 0;                 // resetea a la 1.ª página
    this.updatePagedData();
    
  }

  pageChanged(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;    // (sigue siendo 10)
    this.updatePagedData();
  }
  
  private updatePagedData(): void {
    const start = this.pageIndex * this.pageSize;
    const end   = start + this.pageSize;
    this.displayedServicios = this.servFiltrados.slice(start, end);
  }

  

  guardarEdicion(): void {
    if (this.servSeleccionado) {
      const idServicio = this.servSeleccionado.idservicio;

      // Activar spinner
      this.isLoading = true;

      // Si el usuario seleccionó una nueva imagen
      if (this.nuevaImagen) {
        this.cateringService.subirImagenServicio(this.nuevaImagen, idServicio)
          .subscribe({
            next: (res) => {
              this.servSeleccionado.imagen = res.fotografia.imagen;
              // Ahora actualizamos los demás campos del servicio
              this.actualizarServicio();
            },
            error: (err) => {
              this.isLoading = false; // desactivar spinner en caso de error
              console.error('Error al subir imagen:', err);
            }
          });
      } else {
        // Si no hay imagen nueva, actualizamos directamente
        this.actualizarServicio();
      }
    }
  }

  private actualizarServicio(): void {
    this.cateringService.editarServicio(this.servSeleccionado).subscribe({
      next: () => {
        // Al terminar la actualización, ocultar spinner
        this.isLoading = false;
        this.isEditMode = false;
        this.servSeleccionado = null;
        this.nuevaImagen = null;
        this.obtenerServicios();
      },
      error: (err) => {
        this.isLoading = false; // desactivar spinner en caso de error
        console.error('Error al actualizar el servicio:', err);
      },
    });

  }

  

  eliminarServicios(idservicio: string): void {
    if (confirm('¿Está seguro de que desea eliminar este servicio?')) {
      this.cateringService.eliminarServicio(idservicio).subscribe({
        next: () => {
          this.obtenerServicios();
        },
        error: (err) => {
          console.error('Error al eliminar el servicio:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.servSeleccionado = null;
  }
  cargarLista(): void {
    this.cateringService.getServicio().subscribe({
      next: (data) => {
        this.servicio = data.map(serv => {
          const fotografiaUrl = `${environment.apiUrl}/getfotografia/${serv.imagen}/true`;
          return { ...serv, fotografiaUrl };
        });
        this.servFiltrados = this.servicio;
        this.pageIndex = 0;                 // resetea a la 1.ª página
    this.updatePagedData();
      },
      error: (err) => {
        console.error('Error al obtener los servicios:', err);
      },
    });
  }
  

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }

  nuevaImagen: File | null = null;

onNewImageSelected(event: any): void {
  if (event.target.files && event.target.files.length > 0) {
    this.nuevaImagen = event.target.files[0];
    console.log('Nueva imagen seleccionada:', this.nuevaImagen);
    // Aquí podrías generar una vista previa, etc.
  }
}

private async urlToBase64(url: string): Promise<string> {
  try {
    const blob = await fetch(url).then(r => r.blob());
    return await new Promise<string>(res => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.readAsDataURL(blob);
    });
  } catch (e) {
    console.error('No se pudo convertir la imagen', url, e);
    return '';
  }
}

/* ─────────────────────── UTIL: url → base64 ─────────────────────── */
async downloadPdf(): Promise<void> {

  /* 0) filas: ‘muestra’ vacío y ‘img’ con la base64  */
  const filas = await Promise.all(
    this.servFiltrados.map(async s => ({
      codigo : s.idservicio,
      nombre : s.nombre,
      muestra: '',                                   // ← vacío
      img    : await this.urlToBase64(s.fotografiaUrl),
      tipo   : s.tipo.nombre,
      estado : s.estado.estado
    }))
  );

  /* 1) documento + encabezado (sin cambios) */
  const doc       = new jsPDF({ orientation:'landscape', unit:'pt', format:'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  const header = [
    { txt:'DAAYFOOD S.A.S', size:16, bold:true },
    { txt:'Dirección: Dayuma, Vía principal, Calle C N/A y Km 40', size:11 },
    { txt:'Orellana-Ecuador', size:11 },
    { txt:'Teléfonos: 0992268003 – 0989989254', size:11 }
  ];
  let y = 36;
  header.forEach(l => {
    doc.setFontSize(l.size).setFont('helvetica', l.bold?'bold':'normal');
    doc.text(l.txt, pageWidth/2, y, { align:'center' });
    y += 16;
  });
  y += 8;
  doc.setFontSize(13).setFont('helvetica','bold')
     .text('LISTADO DE SERVICIOS', pageWidth/2, y, { align:'center' });
  y += 18;

  /* 2) definición de columnas */
  const columnas = [
    { header:'Código' , dataKey:'codigo'  },
    { header:'Nombre' , dataKey:'nombre'  },
    { header:'Muestra', dataKey:'muestra' },
    { header:'Tipo'   , dataKey:'tipo'    },
    { header:'Estado' , dataKey:'estado'  }
  ];

  /* 3) tabla + miniaturas */
  autoTable(doc, {
    columns      : columnas,
    body         : filas,
    startY       : y,
    theme        : 'grid',
    columnStyles : { muestra:{ cellWidth:48 } },
    headStyles   : { fillColor:[63,81,181], textColor:255,
                     halign:'center', fontStyle:'bold' },
    bodyStyles   : { fontSize:10, textColor:60 },
    styles       : { cellPadding:4 },

    didParseCell: data => {                           // ⬅⬅
    if (data.column.dataKey === 'muestra' &&
        data.section === 'body') {
      data.cell.styles.minCellHeight = 44;          // 40 img + 2 px arriba/abajo
      data.cell.styles.valign        = 'middle';    // centra texto de otras celdas
    }
  },

    didDrawCell: (data: CellHookData) => {
      if (data.column.dataKey === 'muestra' && data.section === 'body') {
        const img64 = (data.row.raw as any).img;   // nuestra base64
        if (!img64) return;
        const size = 40;
        const x = data.cell.x + (data.cell.width  - size)/2;
        const y = data.cell.y + (data.cell.height - size)/2;
        doc.addImage(img64, 'JPEG', x, y, size, size); // usa 'PNG' si aplica
      }
    }
  });

  /* 4) guardar */
  doc.save('Servicios.pdf');
}

abrirDialogoAgregar(): void {
    const dialogRef = this.dialog.open(ServiciocateringComponent, {
      width: '600px',          
       disableClose: true,
    autoFocus: false  
    }).afterClosed().subscribe(flag => {
              if (flag) this.obtenerServicios();   
            });
          }
          
            editarServicios(servicio: any): void {
            this.dialog.open(ServiciocateringComponent, {
              width: '600px',
              disableClose: true,
              autoFocus: false,
              data: { servicio }                
            }).afterClosed().subscribe(flag => {
              if (flag) this.obtenerServicios();   
            });
          }

}

