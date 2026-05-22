import { Donation } from "./types";
import { formatCurrency } from "./utils";

const escapeHtml = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const formatReceiptDate = (timestamp: number) =>
    new Date(timestamp).toLocaleDateString("en-PH", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

export const buildDonationReceiptHtml = (donation: Donation) => {
    const donorName = donation.isAnonymous ? "Anonymous" : donation.donorName;
    const reference = donation.referenceNumber || donation.id;

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Donation Receipt - ${escapeHtml(reference)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 0; background: #f8fafc; }
    .receipt { max-width: 720px; margin: 40px auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; }
    .header { border-bottom: 2px solid #0f766e; padding-bottom: 20px; margin-bottom: 24px; }
    .eyebrow { color: #0f766e; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
    h1 { margin: 8px 0 0; font-size: 28px; }
    .amount { font-size: 36px; font-weight: 800; color: #0f766e; margin: 20px 0; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .item { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; }
    .label { color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .value { margin-top: 6px; font-size: 15px; font-weight: 700; }
    .note { margin-top: 24px; color: #64748b; font-size: 13px; line-height: 1.6; }
    @media print { body { background: #ffffff; } .receipt { margin: 0; border: 0; } }
  </style>
</head>
<body>
  <main class="receipt">
    <section class="header">
      <div class="eyebrow">Masjid Angullia</div>
      <h1>Donation Receipt</h1>
    </section>
    <div class="amount">${escapeHtml(formatCurrency(donation.amount))}</div>
    <section class="grid">
      <div class="item"><div class="label">Donor</div><div class="value">${escapeHtml(donorName)}</div></div>
      <div class="item"><div class="label">Donation Type</div><div class="value">${escapeHtml(donation.type)}</div></div>
      <div class="item"><div class="label">Date</div><div class="value">${escapeHtml(formatReceiptDate(donation.date))}</div></div>
      <div class="item"><div class="label">Status</div><div class="value">${escapeHtml(donation.status)}</div></div>
      <div class="item"><div class="label">Reference</div><div class="value">${escapeHtml(reference)}</div></div>
      <div class="item"><div class="label">Payment Method</div><div class="value">${escapeHtml(donation.paymentMethod || "Recorded donation")}</div></div>
    </section>
    ${donation.message ? `<p class="note"><strong>Message:</strong> ${escapeHtml(donation.message)}</p>` : ""}
    <p class="note">This receipt was generated from the member portal for your personal records.</p>
  </main>
</body>
</html>`;
};

export const downloadDonationReceipt = (donation: Donation) => {
    const html = buildDonationReceiptHtml(donation);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `donation-receipt-${donation.referenceNumber || donation.id}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};
