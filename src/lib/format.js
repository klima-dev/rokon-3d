// decimal feet -> feet-and-inches string, e.g. 20.333 -> 20'-4"
export const ftin = v => {
  const whole = Math.floor(v + 1e-6);
  let inch = Math.round((v - whole) * 12);
  let w = whole;
  if (inch === 12) { inch = 0; w += 1; }
  return `${w}'-${inch}"`;
};
