export const addAlpha = (hexColor, opacity) => {
  const alpha = Math.round((opacity / 100) * 255).toString(16).padStart(2, '0');
  return hexColor + alpha;
};
