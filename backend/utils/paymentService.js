
export const calculateServiceCharge = (totalAmount) => {
  const percentage = parseFloat(process.env.SERVICE_CHARGE_PERCENTAGE) || 2;
  return (totalAmount * percentage) / 100;
};