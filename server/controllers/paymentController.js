import { deletePaymentById, getAllPayments } from "../services/paymentService.js";

export async function getPayments(req, res) {
  try {
    const payments = await getAllPayments();
    res.json(payments);
  } catch (error) {
    console.error("Failed to fetch payments", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
}

export async function deletePayment(req, res) {
  try {
    const paymentId = Number(req.params.id);
    if (Number.isNaN(paymentId)) {
      return res.status(400).json({ message: "Invalid payment id" });
    }

    await deletePaymentById(paymentId);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to delete payment", error);
    res.status(500).json({ message: "Failed to delete payment" });
  }
}
