export function calculate(inputs = {}) {
  const area = Number(inputs.area_m2 || 0);
  const pontosTomada = Number(inputs.pontos_tomada || 0);
  const pontosIluminacao = Number(inputs.pontos_iluminacao || 0);
  const numRooms = Number(inputs.num_rooms || 0);

  const cabo15 = pontosIluminacao * 3 + area * 0.4;
  const cabo25 = pontosTomada * 4 + area * 0.3;
  const totalCabo = cabo15 + cabo25;

  return {
    profession: 'electrician',
    inputs: { area_m2: area, pontos_tomada: pontosTomada, pontos_iluminacao: pontosIluminacao, num_rooms: numRooms },
    items: [
      { code: 'CAB-H07VU-1.5', description: 'Cabo H07V-U 1.5mm²', item_type: 'material', quantity: roundQty(cabo15), unit: 'm' },
      { code: 'CAB-H07VU-2.5', description: 'Cabo H07V-U 2.5mm²', item_type: 'material', quantity: roundQty(cabo25), unit: 'm' },
      { code: 'TUB-VD-20', description: 'Tubo VD', item_type: 'material', quantity: roundQty(totalCabo * 1.1), unit: 'm' },
      { code: 'DISJ-16A', description: 'Disjuntores', item_type: 'material', quantity: Math.ceil((pontosTomada + pontosIluminacao) / 8), unit: 'un' },
      { code: 'TOM-SCHUKO', description: 'Tomadas Schuko', item_type: 'material', quantity: pontosTomada, unit: 'un' },
      { code: 'INT-SIMPLES', description: 'Interruptores', item_type: 'material', quantity: pontosIluminacao, unit: 'un' },
      { code: 'CX-APARELHAGEM', description: 'Caixas', item_type: 'material', quantity: pontosTomada + pontosIluminacao, unit: 'un' },
      { code: 'MO-ELEC', description: 'Mão de obra eletricista', item_type: 'labor', quantity: roundQty((pontosTomada + pontosIluminacao) * 1.5), unit: 'h' }
    ],
    meta: { num_rooms: numRooms, total_cable_m: roundQty(totalCabo) }
  };
}

function roundQty(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}
