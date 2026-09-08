import requests
from django.conf import settings


def enviar_mensaje_whatsapp(telefono_destino: str, mensaje: str):
    """
    Envía notificaciones de WhatsApp usando Meta WhatsApp Cloud API o servicio de mensajería.
    Si no hay token configurado, simula el envío e imprime en los logs.
    """
    token_api = getattr(settings, 'WHATSAPP_API_TOKEN', None)
    phone_number_id = getattr(settings, 'WHATSAPP_PHONE_ID', None)

    if not token_api or not phone_number_id:
        print(f"\n📱 [SIMULACIÓN WHATSAPP] Enviado a {telefono_destino}:")
        print(f"   Message: {mensaje}\n")
        return {"success": True, "simulated": True}

    url = f"https://graph.facebook.com/v18.0/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {token_api}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": telefono_destino,
        "type": "text",
        "text": {"body": mensaje},
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        return response.json()
    except Exception as e:
        print(f"❌ Error enviando WhatsApp: {e}")
        return {"success": False, "error": str(e)}
