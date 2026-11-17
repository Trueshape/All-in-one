/**
 * Month-by-month simulation. Interest accrues every month on the capitalized
 * balance and is added to it every 12/frequency months; contributions are
 * deposited at the end of each month.
 */
export function simulate(principal: number, monthly: number, annualRate: number, years: number, frequency: number) {
  const months = Math.floor(years * 12);
  const monthlyRate = annualRate / 100 / 12;
  const capitalizeEvery = 12 / frequency;
  let balance = principal;
  let accrued = 0;
  let invested = principal;

  for (let m = 1; m <= months; m++) {
    accrued += balance * monthlyRate;
    balance += monthly;
    invested += monthly;
    if (m % capitalizeEvery === 0) {
      balance += accrued;
      accrued = 0;
    }
  }
  const final = balance + accrued;
  return { invested, interest: Math.max(0, final - invested), final };
}
