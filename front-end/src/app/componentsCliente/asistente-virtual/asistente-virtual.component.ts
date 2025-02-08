import { Component } from '@angular/core';

import { ServiciocateringService } from '../../services/serviciocatering.service';
import { MenusService } from '../../services/menus.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-asistente-virtual',
  standalone: false,
  
  templateUrl: './asistente-virtual.component.html',
  styleUrl: './asistente-virtual.component.css'
})
export class AsistenteVirtualComponent {
  chatAbierto = false;
  chatMinimizado = false;   // si es true, se muestra header pero oculta contenido

  // Historial de mensajes
  mensajes: { remitente: 'user' | 'bot'; texto: string }[] = [];

  // Input del usuario
  mensajeUsuario = '';

  servicios: any[] = []; // aquí guardaremos los servicios
  menus: any[] = [];
  estadoCotizacion = 'none'; 
  carritoCotizacion: {
    idmenu: string;
    nombre: string;
    precio: number;
    cantidad: number;
    subtotal: number;
  }[] = [];
  menuTemporal: any = null;

  constructor(
    private cateringService: ServiciocateringService,
    private menusService: MenusService
  ) {}

  ngOnInit() {
    // Si quieres que se cargue todo al inicio
    this.cargarServiciosYMenus();
  }

  toggleChat() {
    if (!this.chatAbierto) {
      // Al abrir el chat, si no hay historial, agregamos el primer mensaje
      if (this.mensajes.length === 0) {
        this.mensajes.push({
          remitente: 'bot',
          texto: '¿Cómo puedo ayudarte?'
        });
      }
    }
    this.chatAbierto = !this.chatAbierto;
    this.chatMinimizado = false;
  }

  toggleMinimizar() {
    this.chatMinimizado = !this.chatMinimizado;
  }

  cerrarChat() {
    this.chatAbierto = false;
    this.chatMinimizado = false;
    this.mensajes = []; // Borra historial para que al reabrir salgan las opciones de nuevo
  }

  // Cuando el usuario hace clic en una opción (botón)
  seleccionarOpcion(opcion: string) {
    this.mensajes.push({ remitente: 'user', texto: opcion });
    this.responder(opcion);
  }

  enviarMensaje() {
    if (!this.mensajeUsuario.trim()) return;
    this.mensajes.push({ remitente: 'user', texto: this.mensajeUsuario });
    this.responder(this.mensajeUsuario);
    this.mensajeUsuario = '';
  }

  async responder(txt: string) {
    const lower = txt.toLowerCase();
    if (this.estadoCotizacion === 'seleccionMenu') {
      // El usuario nos da un nombre de menú
      const menuEncontrado = this.menus.find(m => m.nombre.toLowerCase().includes(lower));
      if (!menuEncontrado) {
        this.mensajes.push({
          remitente: 'bot',
          texto: 'No encontré ese menú, ¿podrías escribirlo de nuevo?'
        });
        return;
      }
      // Guardamos el menú y pedimos la cantidad
      this.menuTemporal = menuEncontrado;
      this.estadoCotizacion = 'pedirCantidad';
      this.mensajes.push({
        remitente: 'bot',
        texto: `¿Cuántas unidades de "${menuEncontrado.nombre}" deseas cotizar?`
      });
      return;
    }

    if (this.estadoCotizacion === 'pedirCantidad') {
      // Esperamos un número
      const cant = Number(txt);
      if (isNaN(cant) || cant <= 0) {
        this.mensajes.push({
          remitente: 'bot',
          texto: 'Por favor ingresa un número válido.'
        });
        return;
      }

      // Calculamos subtotal
      const subtotal = this.menuTemporal.precio * cant;
      // Agregamos al carrito
      this.carritoCotizacion.push({
        idmenu: this.menuTemporal.idmenu,
        nombre: this.menuTemporal.nombre,
        precio: this.menuTemporal.precio,
        cantidad: cant,
        subtotal
      });
      this.menuTemporal = null;

      // Pasamos a preguntar si desea otro menú
      this.estadoCotizacion = 'preguntarOtro';
      this.mensajes.push({
        remitente: 'bot',
        texto: `He agregado ${cant} de ese menú a tu cotización. ¿Deseas cotizar otro menú? (sí/no)`
      });
      return;
    }

    if (this.estadoCotizacion === 'preguntarOtro') {
      if (lower === 'si' || lower === 'sí') {
        this.estadoCotizacion = 'seleccionMenu';
        this.mensajes.push({
          remitente: 'bot',
          texto: '¿Cuál menú deseas agregar?'
        });
      } else {
        // Terminamos la cotización
        this.estadoCotizacion = 'finCotizacion';
        const total = this.carritoCotizacion.reduce((acc, i) => acc + i.subtotal, 0);
        this.mensajes.push({
          remitente: 'bot',
          texto: `Perfecto. El total de tu cotización es: $${total.toFixed(2)}. Generando PDF...`
        });
        await this.generarPDFCotizacion();
        this.estadoCotizacion = 'none'; // Volvemos a no estar en flujo
        this.mensajes.push({
          remitente: 'bot',
          texto: 'Aquí tienes tu cotización. ¿Te puedo ayudar en algo más?'
        });
      }
      return;
    }

    if (lower.includes('empresa')) {
      // Muestra la información en varios mensajes
      this.mensajes.push({
        remitente: 'bot',
        texto: `DAAYFOOD es una empresa que brinda servicios de Catering, 
  nos caracterizamos por conservar en nuestros menús nacionales e internacionales altos estándares de calidad, 
  utilizando productos 100% naturales en la elaboración de nuestras recetas.`
      });
  
      this.mensajes.push({
        remitente: 'bot',
        texto: `Nuestra Organización está fundamentada en los siguientes valores:
  Calidad en el Servicio, Compromiso, Respeto, Inclusión, Integridad,
  Trabajo en Equipo, Responsabilidad, Ética profesional, Resiliencia.`
      });
  
      this.mensajes.push({
        remitente: 'bot',
        texto: `Tenemos la visión de ser una empresa líder y reconocida a nivel local 
  y de la región amazónica, que busca convertirse en el mayor proveedor de servicios 
  de catering y limpieza del mercado, brindando siempre productos que cumplan con 
  estándares de calidad e inocuidad y con un servicio que demuestre nuestro 
  profesionalismo, excelencia y calidez; para satisfacer las necesidades y expectativas 
  de nuestros clientes.`
      });
  
      this.mensajes.push({
        remitente: 'bot',
        texto: `Mientras que nuestra misión se centra en satisfacer y superar las necesidades 
  y expectativas de nuestros clientes en la Región Amazónica, brindando un servicio de 
  calidad y excelencia; con productos y procesos que garanticen la satisfacción y el 
  bienestar de nuestros consumidores, cumpliendo estándares nacionales e internacionales 
  y con personal altamente calificado.`
      });
  
      // Mensaje final con la pregunta y las opciones
      this.mensajes.push({
        remitente: 'bot',
        texto: '¿Te puedo ayudar en algo más?'
      });
      return;
    }  else if (lower.includes('servicio') || lower.includes('menú')) {
      // (A) Primer mensaje: lista de servicios
      this.mensajes.push({
        remitente: 'bot',
        texto: `Hola contamos con los siguientes servicios:`
      });
      let listadoServicios = '<ul>';
      this.servicios.forEach((s) => {
        listadoServicios += `<li>${s.nombre}</li>`;
      });
      listadoServicios += '</ul>';
      // Empujamos un solo mensaje con ese listado vertical
      this.mensajes.push({
        remitente: 'bot',
        texto: listadoServicios
      });
  
      // (B) Segundo mensaje: aviso de catálogo en PDF
      this.mensajes.push({
        remitente: 'bot',
        texto: 'A continuación te muestro el catálogo completo de los servicios con sus menús...'
      });
  
      // (C) Generar y descargar el PDF
      await this.generarPDFServiciosMenus();

      this.mensajes.push({
        remitente: 'bot',
        texto: '¿Te puedo ayudar en algo más?.'
      });
      
      return;
    
    } else if (lower.includes('cotizar') && this.estadoCotizacion === 'none') {
      this.mensajes.push({
        remitente: 'bot',
        texto: `Hola, si nos has visto nuestros servicios, aquí tienes nuestro catálogo para seleccionar tus menús preferidos...`
      });
      await this.generarPDFServiciosMenus();

      // Cambiamos estado y preguntamos qué menú quiere
      this.estadoCotizacion = 'seleccionMenu';
      this.mensajes.push({
        remitente: 'bot',
        texto: `Ahora que has revisado nuestros menús, dime: ¿Qué menú deseas cotizar?`
      });
      return;
    }

    // 3) NADA COINCIDE
    this.mensajes.push({
      remitente: 'bot',
      texto: 'Lo siento, ¿podrías especificar si quieres info de la empresa, servicios o cotizar?'
    });
  }

  cargarServiciosYMenus() {
    // 1) Obtener servicios
    this.cateringService.getServicio().subscribe({
      next: (data) => {
        // Ajustar si necesitas la URL de la imagen, como en tu LoginComponent
        this.servicios = data.map(serv => {
          const fotografiaUrl = `http://localhost:8010/api/getfotografia/${serv.imagen}/true`;
          return { ...serv, fotografiaUrl };
        });
        // 2) Obtener menús
        this.menusService.getMenu().subscribe({
          next: (dataMenus) => {
            // Ajustar igual que en listarmenus.component
            this.menus = dataMenus.map(m => {
              const fotoMenuUrl = `http://localhost:8010/api/getMenu/${m.imagen}/true`;
              return { ...m, fotoMenuUrl };
            });
          },
          error: (err2) => console.error('Error al obtener menús:', err2)
        });
      },
      error: (err1) => console.error('Error al obtener servicios:', err1)
    });
  }

  async generarPDFCotizacion() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Cotización Detallada', 10, 20);

    let yPos = 40;

    // Listar cada ítem del carrito
    this.carritoCotizacion.forEach((item) => {
      doc.setFontSize(14);
      doc.text(`Menú: ${item.nombre}`, 10, yPos); 
      yPos += 14;

      doc.setFontSize(12);
      doc.text(`Precio: $${item.precio} | Cantidad: ${item.cantidad}`, 10, yPos);
      yPos += 14;

      doc.text(`Subtotal: $${item.subtotal.toFixed(2)}`, 10, yPos);
      yPos += 20; 
    });

    // total final
    const total = this.carritoCotizacion.reduce((acc, i) => acc + i.subtotal, 0);
    doc.setFontSize(14);
    doc.text(`Total: $${total.toFixed(2)}`, 10, yPos);

    // Generamos link PDF
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const linkHTML = `
      <a href="${pdfUrl}" download="cotizacion.pdf" target="_blank">
        Descargar Cotización
      </a>
    `;
    // Enviamos el link al chat
    this.mensajes.push({ remitente: 'bot', texto: linkHTML });
    // Limpiamos carrito si deseas
    // this.carritoCotizacion = [];
  }

  private checkAddPage(doc: jsPDF, yPos: number): number {
    // Altura de la página
    const pageHeight = doc.internal.pageSize.getHeight();
    // Si superamos un umbral (p.e. 270), creamos una nueva página y reiniciamos la posición
    if (yPos >= pageHeight - 20) {
      doc.addPage();
      return 20; // reiniciamos yPos a 20
    }
    return yPos;
  }

  async generarPDFServiciosMenus() {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });

    // Fondo suave
    doc.setFillColor('#FFF8F2');
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

    let y = 70;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Título general centrado
    doc.setFontSize(36);
    doc.setTextColor('#c08a68');
    doc.text('Catálogo de Servicios y Menús', pageWidth / 2, y, { align: 'center' });
    y += 50;

    // Para cada servicio (solo nombre centrado)
    for (const serv of this.servicios) {
      y = this.checkAddPage(doc, y);

      doc.setFontSize(20);
      doc.setTextColor('#6F4E37');
      doc.text(serv.nombre.toUpperCase(), pageWidth / 2, y, { align: 'center' });
      y += 40;

      // Menús de este servicio: imagen a la izquierda y texto a la derecha
      const menusDeEsteServicio = this.menus.filter(m => m.idservicio === serv.idservicio);

      for (const menu of menusDeEsteServicio) {
        y = this.checkAddPage(doc, y);

        // Imagen más grande: 80×80
        const imgX = 60;
        const imgY = y;
        const imgWidth = 80;
        const imgHeight = 80;

        if (menu.fotoMenuUrl) {
          try {
            // Convertimos la imagen con esquinas redondeadas
            const base64Rounded = await this.getBase64ImageRounded(menu.fotoMenuUrl, imgWidth, imgHeight, 10);
            doc.addImage(base64Rounded, 'PNG', imgX, imgY, imgWidth, imgHeight);
          } catch (err) {
            console.error('Error al convertir imagen del menú:', err);
          }
        }

        // Texto a la derecha
        let textX = imgX + imgWidth + 20;
        let currentY = imgY + 15;

        // Nombre del menú
        doc.setFontSize(14);
        doc.setTextColor('#6F4E37');
        doc.text(menu.nombre.toUpperCase(), textX, currentY);
        currentY += 18;

        // Descripción
        doc.setFontSize(12);
        doc.setTextColor('#333');
        const descLines = doc.splitTextToSize(menu.descripcion || '', 250); 
        doc.text(descLines, textX, currentY);
        currentY += descLines.length * 14 + 8;

        // Precio
        doc.setFontSize(14);
        doc.setTextColor('#6F4E37');
        doc.text(`$${menu.precio}`, textX, currentY);

        // Siguiente menú
        const usedHeight = Math.max(imgHeight, (currentY - imgY + 10));
        y += usedHeight + 20;
        y = this.checkAddPage(doc, y);
      }

      y += 50;
      y = this.checkAddPage(doc, y);
    }

    // Blob y enlace
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const linkHTML = `
      <a href="${pdfUrl}" download="catalogo_servicios_menus.pdf" target="_blank">
        Descargar PDF
      </a>
    `;
    this.mensajes.push({ remitente: 'bot', texto: linkHTML });
  }

  /**
   * Redondea las esquinas de la imagen dibujándola en un canvas y haciendo "clip()" 
   * con un rectángulo redondeado. 
   */
  private async getBase64ImageRounded(
    url: string,
    width: number,
    height: number,
    radius: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;

      img.onload = () => {
        // Creamos un canvas del tamaño deseado
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto 2D'));
          return;
        }

        // Dibuja un rectángulo redondeado y hacemos clip
        ctx.beginPath();
        this.roundRectPath(ctx, 0, 0, width, height, radius);
        ctx.clip();

        // Ajustamos la imagen al canvas
        // Podrías usar 'drawImage(img, 0, 0, width, height);' 
        // si quieres forzar a que llene todo el recuadro
        ctx.drawImage(img, 0, 0, width, height);

        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };

      img.onerror = (error) => reject(error);
    });
  }

  /**
   * Traza una ruta de rectángulo con esquinas redondeadas en el context.
   */
  private roundRectPath(
    ctx: CanvasRenderingContext2D,
    x: number, 
    y: number, 
    w: number, 
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }



  getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Para evitar problemas de CORS
      img.crossOrigin = 'Anonymous';
      img.src = url;
  
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto 2D del canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
  
      img.onerror = (error) => {
        reject(error);
      };
    });
  }


}