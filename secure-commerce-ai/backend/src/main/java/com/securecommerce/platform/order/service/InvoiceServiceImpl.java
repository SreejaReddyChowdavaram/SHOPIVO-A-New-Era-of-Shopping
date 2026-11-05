package com.securecommerce.platform.order.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
import com.securecommerce.platform.order.entity.Order;
import com.securecommerce.platform.order.entity.OrderItem;
import com.securecommerce.platform.order.repository.OrderRepository;
import com.securecommerce.platform.payment.entity.Payment;
import com.securecommerce.platform.payment.entity.PaymentMethod;
import com.securecommerce.platform.payment.repository.PaymentRepository;
import com.securecommerce.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InvoiceServiceImpl implements InvoiceService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter
            .ofPattern("dd MMM yyyy, hh:mm a")
            .withZone(ZoneId.of("Asia/Kolkata"));

    private static final DecimalFormat CURRENCY_FORMAT = new DecimalFormat("₹#,##0.00");

    // Colors
    private static final Color PRIMARY_COLOR = new Color(37, 99, 235);    // #2563eb
    private static final Color DARK_TEXT = new Color(17, 24, 39);        // #111827
    private static final Color SECONDARY_TEXT = new Color(75, 85, 99);   // #4b5563
    private static final Color BORDER_COLOR = new Color(229, 231, 235);   // #e5e7eb
    private static final Color HEADER_BG = new Color(243, 244, 246);      // #f3f4f6
    private static final Color MUTED_BG = new Color(249, 250, 251);       // #f9fafb

    @Override
    public byte[] generateInvoicePdf(Long orderId, User requester) {
        // 1. Fetch Order with Items
        Order order = orderRepository.findByIdWithItems(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found with id: " + orderId));

        // 2. Validate Ownership
        if (requester.getRole() == User.Role.CUSTOMER && !order.getCustomer().getId().equals(requester.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to access this invoice");
        }

        if (requester.getRole() == User.Role.SELLER) {
            boolean hasItems = order.getItems().stream()
                    .anyMatch(item -> item.getSeller() != null && item.getSeller().getId().equals(requester.getId()));
            if (!hasItems) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have items in this order");
            }
        }

        // 3. Fetch Payment details if available
        Optional<Payment> optionalPayment = paymentRepository.findByOrderId(orderId);
        Payment payment = optionalPayment.orElse(null);

        // 4. Generate PDF in-memory
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, out);
            document.open();

            // Fonts
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, PRIMARY_COLOR);
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, DARK_TEXT);
            Font sectionTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, PRIMARY_COLOR);
            Font regularBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, DARK_TEXT);
            Font regularText = FontFactory.getFont(FontFactory.HELVETICA, 9, DARK_TEXT);
            Font secondaryText = FontFactory.getFont(FontFactory.HELVETICA, 8, SECONDARY_TEXT);
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, DARK_TEXT);
            Font totalBoldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, PRIMARY_COLOR);

            // ── Top Header Section (Brand + Invoice Number) ──
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{55f, 45f});

            // Brand & Tagline
            PdfPCell leftHeader = new PdfPCell();
            leftHeader.setBorder(Rectangle.NO_BORDER);
            leftHeader.addElement(new Paragraph("SecureCommerce AI", brandFont));
            Paragraph subHeader = new Paragraph("Verified Customer Purchase Invoice", secondaryText);
            subHeader.setSpacingAfter(4);
            leftHeader.addElement(subHeader);
            headerTable.addCell(leftHeader);

            // Invoice Meta Box
            PdfPCell rightHeader = new PdfPCell();
            rightHeader.setBorder(Rectangle.NO_BORDER);
            rightHeader.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph invNum = new Paragraph(String.format("INVOICE NO: INV-%06d", order.getId()), titleFont);
            invNum.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(invNum);

            Paragraph invDate = new Paragraph("Date: " + (order.getCreatedAt() != null ? DATE_FORMATTER.format(order.getCreatedAt()) : "N/A"), secondaryText);
            invDate.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(invDate);

            Paragraph orderStatusPara = new Paragraph("Order Status: " + order.getStatus().name(), regularBold);
            orderStatusPara.setAlignment(Element.ALIGN_RIGHT);
            rightHeader.addElement(orderStatusPara);
            headerTable.addCell(rightHeader);

            document.add(headerTable);

            // Divider Line
            LineSeparator separator = new LineSeparator(1f, 100f, PRIMARY_COLOR, Element.ALIGN_CENTER, -4);
            document.add(new Chunk(separator));
            document.add(new Paragraph(" "));

            // ── Customer & Shipping Addresses ──
            PdfPTable addressTable = new PdfPTable(2);
            addressTable.setWidthPercentage(100);
            addressTable.setWidths(new float[]{50f, 50f});

            // Customer / Billing Cell
            PdfPCell billCell = new PdfPCell();
            billCell.setBackgroundColor(MUTED_BG);
            billCell.setBorderColor(BORDER_COLOR);
            billCell.setPadding(10);
            billCell.addElement(new Paragraph("CUSTOMER DETAILS", sectionTitleFont));
            User customer = order.getCustomer();
            String customerName = (customer.getFirstName() != null ? customer.getFirstName() : "") +
                    (customer.getLastName() != null ? " " + customer.getLastName() : "");
            if (customerName.trim().isEmpty()) customerName = "Customer";
            billCell.addElement(new Paragraph(customerName, regularBold));
            billCell.addElement(new Paragraph("Email: " + customer.getEmail(), secondaryText));
            billCell.addElement(new Paragraph("Customer ID: #" + customer.getId(), secondaryText));
            addressTable.addCell(billCell);

            // Shipping Address Cell
            PdfPCell shipCell = new PdfPCell();
            shipCell.setBackgroundColor(MUTED_BG);
            shipCell.setBorderColor(BORDER_COLOR);
            shipCell.setPadding(10);
            shipCell.addElement(new Paragraph("DELIVERY ADDRESS", sectionTitleFont));
            shipCell.addElement(new Paragraph(order.getShippingFullName(), regularBold));
            String addrLine1 = order.getShippingLine1();
            if (order.getShippingLine2() != null && !order.getShippingLine2().trim().isEmpty()) {
                addrLine1 += ", " + order.getShippingLine2();
            }
            shipCell.addElement(new Paragraph(addrLine1, secondaryText));
            shipCell.addElement(new Paragraph(String.format("%s, %s - %s", order.getShippingCity(), order.getShippingState(), order.getShippingPostalCode()), secondaryText));
            shipCell.addElement(new Paragraph(String.format("%s | Phone: %s", order.getShippingCountry(), order.getShippingPhone()), secondaryText));
            addressTable.addCell(shipCell);

            document.add(addressTable);
            document.add(new Paragraph(" "));

            // ── Items Table ──
            PdfPTable itemTable = new PdfPTable(5);
            itemTable.setWidthPercentage(100);
            itemTable.setWidths(new float[]{6f, 48f, 16f, 10f, 20f});

            // Table Headers
            String[] headers = {"#", "Item Description", "Unit Price", "Qty", "Total (INR)"};
            for (String h : headers) {
                PdfPCell th = new PdfPCell(new Phrase(h, tableHeaderFont));
                th.setBackgroundColor(HEADER_BG);
                th.setBorderColor(BORDER_COLOR);
                th.setPadding(6);
                if (h.equals("#") || h.equals("Qty")) {
                    th.setHorizontalAlignment(Element.ALIGN_CENTER);
                } else if (h.contains("Price") || h.contains("Total")) {
                    th.setHorizontalAlignment(Element.ALIGN_RIGHT);
                } else {
                    th.setHorizontalAlignment(Element.ALIGN_LEFT);
                }
                itemTable.addCell(th);
            }

            // Table Rows
            int index = 1;
            BigDecimal itemsSubtotal = BigDecimal.ZERO;

            for (OrderItem item : order.getItems()) {
                // Index
                PdfPCell cIndex = new PdfPCell(new Phrase(String.valueOf(index++), regularText));
                cIndex.setHorizontalAlignment(Element.ALIGN_CENTER);
                cIndex.setBorderColor(BORDER_COLOR);
                cIndex.setPadding(6);
                itemTable.addCell(cIndex);

                // Description
                PdfPCell cDesc = new PdfPCell(new Phrase(item.getProductNameSnapshot(), regularBold));
                cDesc.setBorderColor(BORDER_COLOR);
                cDesc.setPadding(6);
                itemTable.addCell(cDesc);

                // Unit Price
                PdfPCell cPrice = new PdfPCell(new Phrase(CURRENCY_FORMAT.format(item.getPriceSnapshot()), regularText));
                cPrice.setHorizontalAlignment(Element.ALIGN_RIGHT);
                cPrice.setBorderColor(BORDER_COLOR);
                cPrice.setPadding(6);
                itemTable.addCell(cPrice);

                // Quantity
                PdfPCell cQty = new PdfPCell(new Phrase(String.valueOf(item.getQuantity()), regularText));
                cQty.setHorizontalAlignment(Element.ALIGN_CENTER);
                cQty.setBorderColor(BORDER_COLOR);
                cQty.setPadding(6);
                itemTable.addCell(cQty);

                // Line Total
                PdfPCell cTotal = new PdfPCell(new Phrase(CURRENCY_FORMAT.format(item.getLineTotal()), regularBold));
                cTotal.setHorizontalAlignment(Element.ALIGN_RIGHT);
                cTotal.setBorderColor(BORDER_COLOR);
                cTotal.setPadding(6);
                itemTable.addCell(cTotal);

                itemsSubtotal = itemsSubtotal.add(item.getLineTotal());
            }

            document.add(itemTable);

            // ── Totals & Payment Summary Table ──
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setWidths(new float[]{55f, 45f});

            // Payment Details Box
            PdfPCell payCell = new PdfPCell();
            payCell.setBorder(Rectangle.NO_BORDER);
            payCell.setPadding(8);
            payCell.addElement(new Paragraph("PAYMENT & TRANSACTION SUMMARY", sectionTitleFont));

            if (payment != null) {
                String methodStr = payment.getPaymentMethod().name();
                if (payment.getPaymentMethod() == PaymentMethod.CARD && payment.getCardLast4() != null) {
                    methodStr = "Card (•••• " + payment.getCardLast4() + ")";
                } else if (payment.getPaymentMethod() == PaymentMethod.COD) {
                    methodStr = "Cash on Delivery";
                }
                payCell.addElement(new Paragraph("Payment Method: " + methodStr, regularText));
                payCell.addElement(new Paragraph("Payment Status: " + payment.getPaymentStatus().name(), regularBold));
                payCell.addElement(new Paragraph("Transaction ID: " + payment.getTransactionId(), secondaryText));
                payCell.addElement(new Paragraph("Payment Gateway: " + payment.getPaymentGateway(), secondaryText));
            } else {
                payCell.addElement(new Paragraph("Payment Mode: Cash on Delivery / Pending Record", regularText));
                payCell.addElement(new Paragraph("Payment Status: " + (order.getStatus().name().equals("CONFIRMED") ? "DUE ON DELIVERY" : "PENDING"), secondaryText));
            }

            // Cancellation Notice if applicable
            if (order.getStatus().name().equals("CANCELLED")) {
                Paragraph cancelNote = new Paragraph("Note: Order was cancelled. Product stock restored.", secondaryText);
                cancelNote.getFont().setColor(Color.RED);
                payCell.addElement(cancelNote);
            }

            summaryTable.addCell(payCell);

            // Calculation Breakdown Box
            PdfPCell calcCell = new PdfPCell();
            calcCell.setBorder(Rectangle.NO_BORDER);
            calcCell.setPadding(8);

            PdfPTable calcInner = new PdfPTable(2);
            calcInner.setWidthPercentage(100);
            calcInner.setWidths(new float[]{55f, 45f});

            // Subtotal
            BigDecimal subtotal = order.getSubtotalAmount() != null ? order.getSubtotalAmount() : order.getTotalAmount();
            calcInner.addCell(createCleanCell("Items Subtotal:", Element.ALIGN_RIGHT, regularText));
            calcInner.addCell(createCleanCell(CURRENCY_FORMAT.format(subtotal), Element.ALIGN_RIGHT, regularBold));

            // Discount if applied
            if (order.getDiscountAmount() != null && order.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                String couponLabel = "Coupon Discount" + (order.getCouponCode() != null ? " (" + order.getCouponCode() + "):" : ":");
                calcInner.addCell(createCleanCell(couponLabel, Element.ALIGN_RIGHT, regularText));
                calcInner.addCell(createCleanCell("-" + CURRENCY_FORMAT.format(order.getDiscountAmount()), Element.ALIGN_RIGHT, regularBold));
            }

            // Shipping
            calcInner.addCell(createCleanCell("Shipping Charges:", Element.ALIGN_RIGHT, regularText));
            calcInner.addCell(createCleanCell("FREE", Element.ALIGN_RIGHT, regularBold));

            // Grand Total
            calcInner.addCell(createBorderedTotalCell("Grand Total (INR):", Element.ALIGN_RIGHT, totalBoldFont));
            calcInner.addCell(createBorderedTotalCell(CURRENCY_FORMAT.format(order.getTotalAmount()), Element.ALIGN_RIGHT, totalBoldFont));

            calcCell.addElement(calcInner);
            summaryTable.addCell(calcCell);

            document.add(summaryTable);
            document.add(new Paragraph(" "));

            // ── Footer Notice ──
            Paragraph footer1 = new Paragraph("This is an official system-generated invoice from SecureCommerce AI. No signature required.", secondaryText);
            footer1.setAlignment(Element.ALIGN_CENTER);
            document.add(footer1);

            Paragraph footer2 = new Paragraph("Thank you for choosing SecureCommerce AI Marketplace!", regularBold);
            footer2.setAlignment(Element.ALIGN_CENTER);
            footer2.setSpacingBefore(4);
            document.add(footer2);

            document.close();
            log.info("Invoice PDF generated successfully for orderId={}, customerId={}", order.getId(), order.getCustomer().getId());
            return out.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate invoice PDF for order #{}: {}", orderId, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not generate invoice PDF: " + e.getMessage());
        }
    }

    private PdfPCell createCleanCell(String text, int align, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(align);
        cell.setPadding(3);
        return cell;
    }

    private PdfPCell createBorderedTotalCell(String text, int align, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.TOP | Rectangle.BOTTOM);
        cell.setBorderColor(PRIMARY_COLOR);
        cell.setBorderWidth(1.2f);
        cell.setHorizontalAlignment(align);
        cell.setPaddingTop(6);
        cell.setPaddingBottom(6);
        return cell;
    }
}
