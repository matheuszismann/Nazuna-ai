const MOODS = [
  { id: 'lazy', title: 'Com preguiça', description: 'Acordou tarde e não quer papo longo.', react: 'thinking' },
  { id: 'tsundere', title: 'Irritadiça', description: 'Reclamando de tudo, mas respondendo assim mesmo.', react: 'tsundere' },
  { id: 'happy', title: 'De bom humor', description: 'Curiosa e com vontade de conversar!', react: 'happy' },
  { id: 'sleepy', title: 'Sonolenta', description: 'Respostas mais curtas e bocejando.', react: 'sleepy' }
];

export function getTodayMood() {
  const today = new Date();
  // Cria um índice único para o dia (ex: 20261015)
  const dayHash = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = dayHash % MOODS.length;
  
  return MOODS[index];
}
