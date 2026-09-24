import hmac
import hashlib
import json
import time
import io
import os

import qrcode
from dotenv import load_dotenv

load_dotenv()

QR_SECRET = os.environ.get("QR_SECRET_KEY", "fallback-secret-change-me")


def generate_qr_payload(ticket):
    return {
        "ticket_id": str(ticket.id),
        "event_id": str(ticket.event.id),
        "issued_at": int(time.time()),
    }


def sign_payload(payload):
    message = json.dumps(payload, sort_keys=True).encode("utf-8")
    signature = hmac.new(
        QR_SECRET.encode("utf-8"), message, hashlib.sha256
    ).hexdigest()
    return signature


def generate_qr_base64(ticket):
    payload = generate_qr_payload(ticket)
    signature = sign_payload(payload)

    combined = {
        **payload,
        "signature": signature,
    }

    data = json.dumps(combined, sort_keys=True)

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    import base64
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return f"data:image/png;base64,{b64}", json.dumps(payload), signature


def verify_qr(payload, signature):
    payload_copy = {k: v for k, v in payload.items() if k != "signature"}
    if "issued_at" in payload_copy:
        payload_copy["issued_at"] = int(payload_copy["issued_at"])
    expected = sign_payload(payload_copy)
    return hmac.compare_digest(expected, signature)
