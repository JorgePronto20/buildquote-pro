export function calculate(inputs = {}) {
  const metrosTubagem = Number(inputs.metros_tubagem || 0);
  const pontosAgua = Number(inputs.pontos_agua || 0);
  const numSanitary = Number(inputs.num_sanitary || 0);

  return {
    profession: 'plumber',
    inputs: { metros_tubagem: metrosTubagem, pontos_agua: pontosAgua, num_sanitary: numSanitary },
    items: [
      { code: 'TUB-MULTI', description: 'Tubo multicamada', item_type: 'material', quantity: roundQty(metrosTubagem * 1.15), unit: 'm' },
      { code: 'COTOVELO', description: 'Acessórios cotovelos', item_type: 'material', quantity: pontosAgua * 3, unit: 'un' },
      { code: 'VALVULA', description: 'Válvulas', item_type: 'material', quantity: pontosAgua + 2, unit: 'un' },
      { code: 'MO-CANAL', description: 'Mão de obra canalização', item_type: 'labor', quantity: roundQty(pontosAgua * 2), unit: 'h' }
    ],
    meta: { num_sanitary: numSanitary }
  };
}

function roundQty(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}
