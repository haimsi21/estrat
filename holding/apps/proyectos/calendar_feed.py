from django.http import HttpResponse
from apps.proyectos.models import Fase


def exportar_calendario_ical(request):
    """
    Genera un archivo .ics estándar para que Google Calendar, Outlook o iPhone Calendar
    se suscriban dinámicamente al calendario de fechas de compromiso del Holding.
    """
    fases = Fase.objects.select_related('proyecto').filter(completada=False)

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Holding Ro//ERP Calendario de Avances//ES",
        "X-WR-CALNAME:Holding Ro - Fechas Compromiso",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
    ]

    for fase in fases:
        if fase.fecha_compromiso:
            fecha_str = fase.fecha_compromiso.strftime("%Y%m%d")
            lines.extend([
                "BEGIN:VEVENT",
                f"SUMMARY:📌 {fase.proyecto.nombre} — {fase.nombre}",
                f"DESCRIPTION:Compromiso de entrega fase {fase.nombre} ({fase.porcentaje_avance}% avance actual)",
                f"DTSTART;VALUE=DATE:{fecha_str}",
                f"DTEND;VALUE=DATE:{fecha_str}",
                f"UID:fase_{fase.id}@holdingro.com",
                "STATUS:CONFIRMED",
                "END:VEVENT",
            ])

    lines.append("END:VCALENDAR")
    response = HttpResponse("\r\n".join(lines), content_type="text/calendar; charset=utf-8")
    response['Content-Disposition'] = 'inline; filename="holding_ro_calendar.ics"'
    return response
