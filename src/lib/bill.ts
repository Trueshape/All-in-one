type Amount = { percent: number } | { fixed: number };

/** A discount comes off the bill (a fixed one never exceeds it); a percentage tip is on the discounted bill. */
export function splitBill({ bill, discount, tip, people }: { bill: number; discount: Amount; tip: Amount; people: number }) {
  const discountAmount = "percent" in discount ? bill * (discount.percent / 100) : Math.min(discount.fixed, bill);
  const discounted = bill - discountAmount;
  const tipAmount = "percent" in tip ? discounted * (tip.percent / 100) : tip.fixed;
  const total = discounted + tipAmount;
  return { discountAmount, tipAmount, total, perPerson: total / people };
}
