import { toast } from 'sonner'

function cargarJsPDF(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).jspdf && (window as any).jspdf.jsPDF) {
      resolve((window as any).jspdf.jsPDF)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
    script.onload = () => {
      if ((window as any).jspdf && (window as any).jspdf.jsPDF) {
        resolve((window as any).jspdf.jsPDF)
      } else {
        reject(new Error('jsPDF no se pudo cargar'))
      }
    }
    script.onerror = () => reject(new Error('Error cargando jsPDF CDN'))
    document.head.appendChild(script)
  })
}

export async function descargarPDFProspecto(lead: any) {
  const toastId = toast.loading('Generando PDF vectorial de alta definición...')

  try {
    const jsPDF = await cargarJsPDF()
    const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' })

    const c = lead.cliente || {}
    const nombreCliente = (lead.cliente_nombre || c.nombre_comercial || c.razon_social || 'Prospecto').toUpperCase()
    const empresaNombre = lead.empresa_nombre || lead.empresa?.nombre || 'Grupo Fiat'
    const tiposStr = (lead.tipos_proyecto || []).join(', ') || 'General'
    const entregablesStr = (lead.entregables_esperados || []).join(', ') || 'Por definir'
    const infoExistenteStr = (lead.informacion_existente || []).join(', ') || 'Ninguna'
    const versionNum = lead.version || 1
    const montoFormat = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(lead.monto_presupuesto || c.presupuesto_estimado || 0))
    const archivosBrief = lead.archivos_adjuntos || []
    const tiposDetalle = lead.tipos_proyecto_detalle || []

    const nombreLimpio = nombreCliente.replace(/[^a-zA-Z0-9]/g, '_')
    const nombreArchivoPDF = `BRIEF_OFICIAL_v${versionNum}_${nombreLimpio}_GRUPO_FIAT.pdf`

    // ---- CABECERA OFICIAL GRUPO FIAT ----
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.setTextColor(15, 23, 42) // #0f172a
    doc.text("GRUPO FIAT", 15, 20)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(197, 160, 89) // #c5a059
    doc.text("ARCKAM INTERIORISMO COMERCIAL • HERMA AGENCY", 15, 25)

    // BADGE DE VERSIÓN
    doc.setFillColor(15, 23, 42)
    doc.roundedRect(150, 13, 50, 10, 2, 2, 'F')
    doc.setFont("courier", "bold")
    doc.setFontSize(9)
    doc.setTextColor(224, 184, 104) // #e0b868
    doc.text(`BRIEF OFICIAL v${versionNum}`, 154, 19.5)

    // LÍNEA DORADA
    doc.setDrawColor(197, 160, 89)
    doc.setLineWidth(1)
    doc.line(15, 28, 200, 28)

    // HELPER PARA DIBUJAR CAJAS
    const drawBox = (x: number, y: number, w: number, h: number, title: string) => {
      doc.setFillColor(248, 250, 252) // #f8fafc
      doc.setDrawColor(203, 213, 225) // #cbd5e1
      doc.setLineWidth(0.3)
      doc.roundedRect(x, y, w, h, 2, 2, 'FD')

      doc.setFont("helvetica", "bold")
      doc.setFontSize(7.5)
      doc.setTextColor(71, 85, 105) // #475569
      doc.text(title.toUpperCase(), x + 3, y + 5)
    }

    const drawSectionHeader = (y: number, title: string) => {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8.5)
      doc.setTextColor(197, 160, 89)
      doc.text(title.toUpperCase(), 15, y)
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.4)
      doc.line(15, y + 2, 200, y + 2)
      return y + 7
    }

    // ---- 1. DATOS BÁSICOS & UBICACIÓN ----
    drawBox(15, 33, 90, 28, "1. Prospecto / Datos del Cliente")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(nombreCliente.slice(0, 32), 18, 43)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`${c.razon_social || ''} | RFC: ${c.rfc || 'XAX010101000'}`.slice(0, 45), 18, 47)
    doc.text(`Contacto: ${c.contacto_nombre || 'N/A'} | Tel: ${c.contacto_telefono || 'N/A'}`.slice(0, 45), 18, 51)
    doc.text(`Email: ${c.contacto_email || 'N/A'}`.slice(0, 45), 18, 55)

    drawBox(110, 33, 90, 28, "Ubicación & Línea de Negocio")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(empresaNombre, 113, 43)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`Proyecto: ${lead.nombre_proyecto || 'General'}`.slice(0, 45), 113, 47)
    doc.text(`Ubicación: ${c.ubicacion || lead.sucursal_ubicacion || 'CDMX'}`.slice(0, 45), 113, 51)
    doc.text(`Código Postal (CP): ${c.codigo_postal || 'N/A'}`, 113, 55)

    // ---- 2. ESPECIALIDADES ----
    let curY = drawSectionHeader(66, "2. Especialidades Seleccionadas & Responsables de Área")
    drawBox(15, curY, 185, 20, "")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(180, 83, 9) // #b45309
    doc.text(tiposStr.slice(0, 90), 18, curY + 6)

    if (tiposDetalle.length > 0) {
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(37, 99, 235)
      let lineY = curY + 11
      tiposDetalle.slice(0, 2).forEach((td: any) => {
        doc.text(`• ${td.tipo}: ${td.responsable_nombre || 'Sin asignar'} (${td.entregable || 'Propuesta'})`, 18, lineY)
        lineY += 4
      })
    }

    // ---- 3. NECESIDAD DEL CLIENTE ----
    curY = drawSectionHeader(curY + 25, "3. Requerimiento / Necesidad del Prospecto")
    drawBox(15, curY, 185, 18, "")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    const necesidadLineas = doc.splitTextToSize(lead.necesidad_cliente || 'No especificada', 178)
    doc.text(necesidadLineas.slice(0, 3), 18, curY + 6)

    // ---- 4 & 5. ENTREGABLES & INFORMACIÓN EXISTENTE ----
    curY += 23
    drawBox(15, curY, 90, 20, "4. Entregables Esperados")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(37, 99, 235)
    doc.text(entregablesStr.slice(0, 45), 18, curY + 11)

    drawBox(110, curY, 90, 20, "5. Información Existente")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text(infoExistenteStr.slice(0, 45), 113, curY + 11)

    if (archivosBrief.length > 0) {
      curY += 22
      drawBox(15, curY, 185, 12, "Archivos Cargados en Bóveda In-House")
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.setTextColor(51, 65, 85)
      const archivosNombres = archivosBrief.map((a: any) => a.file_name).join(', ')
      doc.text(` Archivos (${archivosBrief.length}): ${archivosNombres}`.slice(0, 95), 18, curY + 8)
    }

    // ---- 6 & 7. PRESUPUESTO & FECHAS CLAVE ----
    curY += archivosBrief.length > 0 ? 16 : 24
    curY = drawSectionHeader(curY, "6 & 7. Estructura Financiera & Fechas Clave")
    drawBox(15, curY, 58, 20, "Presupuesto Objetivo")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.setTextColor(5, 150, 105) // #059669
    doc.text(montoFormat, 18, curY + 11)

    drawBox(78, curY, 58, 20, "Propuesta Requerida")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text(lead.fecha_cotizacion_requerida || 'Por definir', 81, curY + 11)

    drawBox(141, curY, 59, 20, "Entrega Proyecto")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text(`${lead.fecha_entrega_requerida || 'Por definir'} ${lead.fecha_inamovible ? '(Inamovible)' : ''}`, 144, curY + 11)

    // ---- 8, 9 & 10. GOBERNANZA & TRANSFERENCIA SLA ----
    curY = drawSectionHeader(curY + 25, "8, 9 & 10. Origen, Observaciones & Transferencia SLA")
    drawBox(15, curY, 58, 20, "Origen & Estatus")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text(`${lead.origen || 'Web'} • ${lead.estatus || 'Solicitud'}`.slice(0, 25), 18, curY + 11)

    drawBox(78, curY, 58, 20, "Área / Responsable SLA")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(37, 99, 235)
    const respNombreStr = lead.siguiente_accion_responsable_nombre || lead.responsable_nombre || 'Por asignar'
    doc.text(`${lead.siguiente_accion_area || 'Arquitectura'}: ${respNombreStr}`.slice(0, 28), 81, curY + 11)

    drawBox(141, curY, 59, 20, "Fecha Compromiso SLA")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(9)
    doc.setTextColor(217, 119, 6)
    doc.text(lead.siguiente_accion_fecha_compromiso || 'Por definir', 144, curY + 11)

    // ---- FIRMAS OFICIALES ----
    const firmaY = 245
    doc.setDrawColor(100, 116, 139)
    doc.setLineWidth(0.5)
    doc.line(25, firmaY, 90, firmaY)
    doc.line(125, firmaY, 190, firmaY)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(30, 41, 59)
    doc.text("ELABORADO POR ASESOR COMERCIAL", 30, firmaY + 5)
    doc.text("ACEPTADO POR RESPONSABLE DE ÁREA", 130, firmaY + 5)

    // PIE DE PÁGINA
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(15, 262, 200, 262)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text("Ficha Oficial Grupo Fiat • Documento de Control Interno", 15, 267)
    doc.text(`Versión ${versionNum} • Emisión: ${new Date().toLocaleString('es-MX')}`, 130, 267)

    // ---- DESCARGA DIRECTA INSTANTÁNEA EN 1 CLIC ----
    doc.save(nombreArchivoPDF)
    toast.dismiss(toastId)
    toast.success('¡PDF One-Pager descargado exitosamente!')

  } catch (error: any) {
    console.error("Error generando PDF vectorial:", error)
    toast.dismiss(toastId)
    toast.error("Error al generar el archivo PDF")
  }
}

export async function descargarPDFCotizacion(cotizacion: any) {
  const toastId = toast.loading('Generando Cotización PDF...')

  try {
    const jsPDF = await cargarJsPDF()
    const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' })

    const montoFormat = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(cotizacion.monto || 0))
    const nombreLimpio = (cotizacion.lead_cliente || 'CLIENTE').replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()
    const nombreArchivoPDF = `COTIZACION_${nombreLimpio}_GRUPO_FIAT.pdf`

    // CABECERA
    doc.setFont("helvetica", "bold")
    doc.setFontSize(20)
    doc.setTextColor(15, 23, 42)
    doc.text("GRUPO FIAT", 15, 20)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(197, 160, 89)
    doc.text("ARCKAM INTERIORISMO COMERCIAL • HERMA AGENCY", 15, 25)

    doc.setFillColor(147, 51, 234)
    doc.roundedRect(135, 13, 65, 10, 2, 2, 'F')
    doc.setFont("helvetica", "bold")
    doc.setFontSize(8.5)
    doc.setTextColor(255, 255, 255)
    doc.text("PROPUESTA DE COTIZACIÓN", 138, 19.5)

    doc.setDrawColor(197, 160, 89)
    doc.setLineWidth(1)
    doc.line(15, 28, 200, 28)

    const drawBox = (x: number, y: number, w: number, h: number, title: string) => {
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(203, 213, 225)
      doc.setLineWidth(0.3)
      doc.roundedRect(x, y, w, h, 2, 2, 'FD')

      doc.setFont("helvetica", "bold")
      doc.setFontSize(7.5)
      doc.setTextColor(71, 85, 105)
      doc.text(title.toUpperCase(), x + 3, y + 5)
    }

    drawBox(15, 33, 90, 22, "Cliente / Prospecto")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text((cotizacion.lead_cliente || 'Cliente').slice(0, 32), 18, 43)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`Línea de Negocio: ${cotizacion.lead_empresa || 'Grupo Fiat'}`, 18, 48)

    drawBox(110, 33, 90, 22, "Estatus & Vigencia")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(cotizacion.aprobada ? '✓ APROBADA Y FIRMADA' : 'PENDIENTE DE FIRMA', 113, 43)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`Vigencia Hasta: ${cotizacion.vigencia || 'N/A'}`, 113, 48)

    drawBox(15, 60, 185, 20, "Concepto de la Propuesta")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(cotizacion.concepto.slice(0, 85), 18, 71)

    drawBox(15, 85, 185, 25, "Inversión & Esquema de Pago")
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.setTextColor(5, 150, 105)
    doc.text(montoFormat, 18, 100)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text("Esquema Sugerido: 50% Anticipo / 40% Avance / 10% Finiquito", 110, 100)

    // FIRMAS
    const firmaY = 220
    doc.setDrawColor(100, 116, 139)
    doc.setLineWidth(0.5)
    doc.line(25, firmaY, 90, firmaY)
    doc.line(125, firmaY, 190, firmaY)

    doc.setFont("helvetica", "bold")
    doc.setFontSize(8)
    doc.setTextColor(30, 41, 59)
    doc.text("FIRMA ACEPTACIÓN DIRECCIÓN COMERCIAL", 25, firmaY + 5)
    doc.text("FIRMA CONFORMIDAD DEL CLIENTE", 130, firmaY + 5)

    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(15, 262, 200, 262)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text("Cotización Oficial Grupo Fiat", 15, 267)
    doc.text(`Emisión: ${new Date().toLocaleString('es-MX')}`, 130, 267)

    doc.save(nombreArchivoPDF)
    toast.dismiss(toastId)
    toast.success('Cotización PDF descargada exitosamente')

  } catch (error: any) {
    console.error("Error generando PDF Cotización:", error)
    toast.dismiss(toastId)
    toast.error("Error al generar Cotización PDF")
  }
}
