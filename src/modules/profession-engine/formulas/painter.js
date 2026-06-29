export function calculate(inputs = {}) {
  const area = Number(inputs.area_m2 || 0);
  const numCoats = Number(inputs.num_coats || 1);
  const hasCeiling = Boolean(inputs.has_ceiling || false);
  const effectiveArea = hasCeiling ? area * 1.15 : area;
  const estimatedPerimeter = Math.sqrt(Math.max(effectiveArea, 0)) * 4;

  return {
    profession: 'painter',
    inputs: { area_m2: area, num_coats: numCoats, has_ceiling: hasCeiling },
    items: [
      { code: 'TINTA-INT', description: 'Tinta interior', item_type: 'material', quantity: roundQty(effectiveArea * numCoats / 10), unit: 'L' },
      { code: 'PRIMARIO', description: 'Primário', item_type: 'material', quantity: roundQty(effectiveArea / 12), unit: 'L' },
      { code: 'LIXA', description: 'Lixa', item_type: 'consumable', quantity: Math.ceil(effectiveArea / 5), unit: 'un' },
      { code: 'PLASTICO-PROT', description: 'Plástico de proteção', item_type: 'consumable', quantity: roundQty(effectiveArea * 1.2), unit: 'm2' },
      { code: 'FITA-PINT', description: 'Fita adesiva', item_type: 'consumable', quantity: roundQty(estimatedPerimeter * numCoats), unit: 'm' },
      { code: 'MO-PINT', description: 'Mão de obra pintura', item_type: 'labor', quantity: roundQty(effectiveArea * 0.25), unit: 'h' }
    ],
    meta: { effective_area_m2: roundQty(effectiveArea), estimated_perimeter_m: roundQty(estimatedPerimeter) }
  };
}

function roundQty(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}
