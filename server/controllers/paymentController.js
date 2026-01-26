import { getAllPayments } from "../services/paymentService.js";

export async function getPayments(req, res) {
  try {
    const payments = await getAllPayments();
    res.json(payments);
  } catch (error) {
    console.error("Failed to fetch payments", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
}
