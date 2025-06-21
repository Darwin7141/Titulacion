import { Component, OnInit,EventEmitter, Output } from '@angular/core';
import { ClientesService } from '../../services/clientes.service';
import { PageEvent } from '@angular/material/paginator'; 
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
@Component({
  selector: 'app-listarclientes',
  standalone: false,
  
  templateUrl: './listarclientes.component.html',
  styleUrl: './listarclientes.component.css'
})
export class ListarclientesComponent implements OnInit {
  cliente: any[] = [];
  cliFiltrados: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  cliSeleccionado: any = null;
  displayedClientes: any[] = [];
  pageSize = 5;
  pageIndex = 0;


  @Output() cerrar = new EventEmitter<void>();
  volver(){ this.cerrar.emit(); }

  constructor(private clienteService: ClientesService) {}

  ngOnInit(): void {
   
    this.obtenerClientes();
    this.cargarLista();
  }

  obtenerClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.cliente = data;
        this.cliFiltrados = data;
        this.updatePagedData();  
      },
      error: (err) => {
        console.error('Error al obtener clientes', err);
      },
    });
  }

  buscarCliente(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.cliFiltrados = this.cliente; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.cliFiltrados = this.cliente.filter((cliente) =>
        cliente.nombre.toLowerCase().includes(searchTermLower) ||
        cliente.ci.toLowerCase().includes(searchTermLower) // Filtra también por código
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
    this.displayedClientes = this.cliFiltrados.slice(start, end);
  }


  editarClientes(cliente: any): void {
    this.isEditMode = true;
    this.cliSeleccionado = { ...cliente }; // Copia para evitar modificar el original
  }

  guardarEdicion(): void {
    if (this.cliSeleccionado) {
      this.clienteService.editarCliente(this.cliSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.cliSeleccionado = null;
          this.obtenerClientes();
        },
        error: (err) => {
          console.error('Error al actualizar empleado:', err);
        },
      });
    }
  }
  

  eliminarCliente(codigocliente: string): void {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
      this.clienteService.eliminarCliente(codigocliente).subscribe({
        next: () => {
          this.obtenerClientes();
        },
        error: (err) => {
          console.error('Error al eliminar cliente:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.cliSeleccionado = null;
  }
  cargarLista(): void {
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.cliente = data;
        this.cliFiltrados = data;
        this.pageIndex = 0;          // ← vuelvo a la primera página
      this.updatePagedData(); 
      },
      error: (err) => {
        console.error('Error al obtener clientes:', err);
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }

  downloadPdf(): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  /* 1) Encabezado corporativo ------------------------------------------------ */
  const headerLines = [
    { txt: 'DAAYFOOD S.A.S', size: 16, bold: true  },
    { txt: 'Dirección: Dayuma, Vía principal, Calle C N/A y Km 40', size: 11 },
    { txt: 'Orellana-Ecuador', size: 11 },
    { txt: 'Teléfonos: 0992268003 – 0989989254', size: 11 }
  ];

  let y = 36;                               // margen superior
  headerLines.forEach(line => {
    doc.setFontSize(line.size);
    doc.setFont('helvetica', line.bold ? 'bold' : 'normal');
    doc.text(line.txt, pageWidth / 2, y, { align: 'center' });
    y += 16;                                // siguiente línea
  });

  /* Título de la tabla */
  y += 8;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('LISTADO DE CLIENTES', pageWidth / 2, y, { align: 'center' });
  y += 18;

  /* 2) Datos ----------------------------------------------------------------- */
  const headers = [[
    'Código', 'Cédula', 'Nombre', 'Dirección', 'Correo Electrónico', 'Teléfono'
  ]];

  const body = this.cliFiltrados.map(cli => [
    cli.codigocliente, cli.ci, cli.nombre,
    cli.direccion, cli.e_mail, cli.telefono
  ]);

  /* 3) autoTable ------------------------------------------------------------- */
  autoTable(doc, {
    head: headers,
    body,
    startY: y,
    theme: 'grid',
    headStyles: {
      fillColor: [63, 81, 181],
      textColor: 255,
      halign: 'center',
      fontStyle: 'bold'
    },
    bodyStyles: { fontSize: 10, textColor: 60 },
    styles: { cellPadding: 4, overflow: 'linebreak' }
  });

  /* 4) Descargar ------------------------------------------------------------- */
  doc.save('clientes.pdf');
}
}

