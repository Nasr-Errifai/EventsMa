import json
import io
import base64

import qrcode
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.colors import HexColor


def _build_qr_buffer(ticket):
    payload = ticket.qr_payload
    if isinstance(payload, str):
        payload = json.loads(payload)
    signature = ticket.qr_signature

    combined = {**payload, "signature": signature}
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
    return buffer


def get_qr_image(ticket):
    return _build_qr_buffer(ticket)


def get_qr_image_base64(ticket):
    buffer = _build_qr_buffer(ticket)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"


def generate_pdf_ticket(ticket):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name="EventTitle", parent=styles["Heading1"],
        fontSize=22, textColor=HexColor("#1e293b"),
        alignment=TA_CENTER, spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        name="EventSubtitle", parent=styles["Normal"],
        fontSize=12, textColor=HexColor("#64748b"),
        alignment=TA_CENTER, spaceAfter=12,
    ))
    styles.add(ParagraphStyle(
        name="EventLabel", parent=styles["Normal"],
        fontSize=10, textColor=HexColor("#94a3b8"),
        spaceAfter=1, spaceBefore=10,
    ))
    styles.add(ParagraphStyle(
        name="EventValue", parent=styles["Normal"],
        fontSize=14, textColor=HexColor("#334155"),
        spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        name="EventTicketId", parent=styles["Normal"],
        fontSize=8, textColor=HexColor("#cbd5e1"),
        alignment=TA_CENTER, spaceBefore=15,
    ))

    story = []
    story.append(Paragraph("Event Ticket", styles["EventTitle"]))
    story.append(Paragraph(ticket.event.title, styles["EventSubtitle"]))
    story.append(Paragraph("Date", styles["EventLabel"]))
    story.append(Paragraph(
        ticket.event.start_date.strftime("%B %d, %Y at %I:%M %p"),
        styles["EventValue"],
    ))
    story.append(Paragraph("Location", styles["EventLabel"]))
    story.append(Paragraph(ticket.event.location, styles["EventValue"]))
    story.append(Paragraph("Ticket Holder", styles["EventLabel"]))
    story.append(Paragraph(ticket.user.email, styles["EventValue"]))
    story.append(Spacer(1, 15))

    qr_png = get_qr_image(ticket)
    qr_png.seek(0)
    qr_img = Image(qr_png, width=120 * mm, height=120 * mm)
    qr_img.hAlign = "CENTER"
    story.append(qr_img)

    story.append(Paragraph(f"Ticket ID: {ticket.id}", styles["EventTicketId"]))

    doc.build(story)
    buffer.seek(0)
    return buffer
