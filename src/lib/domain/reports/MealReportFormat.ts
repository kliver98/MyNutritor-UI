export interface MealBreakdownItem {
  name: string;
  brand: string;
  amount: number;
  unit: string;
  calories: number;
  proteinGrams: number;
  fatsGrams: number;
  carbsGrams: number;
}

export interface MealNutritionalSummary {
  calories: number;
  proteinGrams: number;
  fatsGrams: number;
  carbsGrams: number;
}

export interface ParsedMealReport {
  title: string;
  macros: MealNutritionalSummary;
  items: MealBreakdownItem[];
}

/**
 * Genera el documento Markdown exacto para users/{username}/reports
 * cumpliendo con la estructura esperada por la app móvil y web:
 *
 * ### 🥗 NOMBRE DEL ALIMENTO
 * {title}
 *
 * ---
 *
 * ### 📊 INFORMACIÓN NUTRICIONAL ESTIMADA
 * - **Proteínas:** {P} g
 * - **Grasas:** {G} g
 * - **Carbohidratos:** {C} g
 * - **Calorías Totales:** {Cal} Kcal
 *
 * ---
 *
 * ### 💡 EVALUACIÓN Y RECOMENDACIONES
 * NOMBRE DEL PLATO REGISTRADO: {title}
 *
 * RESUMEN DE MACRONUTRIENTES Y CALORÍAS CALCULADAS:
 * - Calorías Totales: {Cal} Kcal
 * - Proteínas Totales: {P} g
 * - Grasas Totales: {G} g
 * - Carbohidratos Totales: {C} g
 *
 * DESGLOSE DE ELEMENTOS CONSUMIDOS EN EL PLATO:
 * 1. ...
 */
export function generateMealReportMarkdown(params: {
  title: string;
  items: MealBreakdownItem[];
  calculatedMacros: MealNutritionalSummary;
}): string {
  const { title, items, calculatedMacros } = params;

  const dishTitle = title.trim() || 'Comida Registrada';
  const cal = Math.round(calculatedMacros.calories);
  const p = Math.round(calculatedMacros.proteinGrams);
  const g = Math.round(calculatedMacros.fatsGrams);
  const c = Math.round(calculatedMacros.carbsGrams);

  const breakdownLines = items.map((item, index) => {
    const brand = item.brand?.trim() || 'General Promedio';
    const unit = item.unit?.trim() || 'g';
    const itemCal = Math.round(item.calories);
    const itemP = Math.round(item.proteinGrams);
    const itemG = Math.round(item.fatsGrams);
    const itemC = Math.round(item.carbsGrams);

    return `${index + 1}. ${item.name} (${brand}) - Cantidad consumida: ${item.amount}${unit} (Aporte: ${itemCal} Kcal, P: ${itemP}g, G: ${itemG}g, C: ${itemC}g)`;
  });

  return `### 🥗 NOMBRE DEL ALIMENTO
${dishTitle}

---

### 📊 INFORMACIÓN NUTRICIONAL ESTIMADA
- **Proteínas:** ${p} g
- **Grasas:** ${g} g
- **Carbohidratos:** ${c} g
- **Calorías Totales:** ${cal} Kcal

---

### 💡 EVALUACIÓN Y RECOMENDACIONES
NOMBRE DEL PLATO REGISTRADO: ${dishTitle}

RESUMEN DE MACRONUTRIENTES Y CALORÍAS CALCULADAS:
- Calorías Totales: ${cal} Kcal
- Proteínas Totales: ${p} g
- Grasas Totales: ${g} g
- Carbohidratos Totales: ${c} g

DESGLOSE DE ELEMENTOS CONSUMIDOS EN EL PLATO:
${breakdownLines.join('\n')}`;
}

/**
 * Parsea el Markdown de un reporte guardado en Firestore.
 */
export function parseMealReportMarkdown(markdown: string): ParsedMealReport | null {
  if (!markdown || typeof markdown !== 'string') return null;

  // Extraer Título (soporta misma línea como "### 🥗 NOMBRE DEL ALIMENTO Desayuno -" o línea siguiente)
  const titleMatch =
    markdown.match(/###\s*🥗\s*NOMBRE DEL ALIMENTO\s*[:\s-]*([^\n-]+)/i) ||
    markdown.match(/###\s*🥗\s*NOMBRE DEL ALIMENTO\s*[:\s-]*\n+([^\n-]+)/i) ||
    markdown.match(/NOMBRE DEL PLATO REGISTRADO:\s*([^\n]+)/i);
  const title = titleMatch ? titleMatch[1].trim() : 'Comida';

  // Extraer Macros
  const calMatch = markdown.match(
    /(?:\*\*Calorías Totales:\*\*|Calorías Totales:)\s*(\d+(?:\.\d+)?)\s*Kcal/i
  );
  const pMatch = markdown.match(/(?:\*\*Proteínas:\*\*|Proteínas Totales:)\s*(\d+(?:\.\d+)?)\s*g/i);
  const gMatch = markdown.match(/(?:\*\*Grasas:\*\*|Grasas Totales:)\s*(\d+(?:\.\d+)?)\s*g/i);
  const cMatch = markdown.match(
    /(?:\*\*Carbohidratos:\*\*|Carbohidratos Totales:)\s*(\d+(?:\.\d+)?)\s*g/i
  );

  const calories = calMatch ? Number(calMatch[1]) : 0;
  const proteinGrams = pMatch ? Number(pMatch[1]) : 0;
  const fatsGrams = gMatch ? Number(gMatch[1]) : 0;
  const carbsGrams = cMatch ? Number(cMatch[1]) : 0;

  // Extraer Items de desglose
  // Formato: 1. Huevo (General Promedio) - Cantidad consumida: 112g (Aporte: 162 Kcal, P: 14g, G: 11g, C: 0g)
  const items: MealBreakdownItem[] = [];
  const lineRegex =
    /^\s*(?:\d+[.)]|\*|-)\s*(.+?)(?:\s*\(([^)]*)\))?\s*-\s*Cantidad(?:\s+consumida)?:\s*([\d.]+)\s*([a-zA-Z%]*)\s*\(Aporte:\s*([\d.]+)\s*(?:Kcal|kcal),\s*P:\s*([\d.]+)\s*g,\s*G:\s*([\d.]+)\s*g,\s*C:\s*([\d.]+)\s*g\)/gim;

  let match: RegExpExecArray | null;
  while ((match = lineRegex.exec(markdown)) !== null) {
    items.push({
      name: match[1].trim(),
      brand: match[2]?.trim() || 'General Promedio',
      amount: Number(match[3]) || 0,
      unit: match[4]?.trim() || 'g',
      calories: Number(match[5]) || 0,
      proteinGrams: Number(match[6]) || 0,
      fatsGrams: Number(match[7]) || 0,
      carbsGrams: Number(match[8]) || 0
    });
  }

  // Intento 2: Si no hubo matches con aporte nutricional pero hay líneas bajo "DESGLOSE"
  if (items.length === 0 && /DESGLOSE/i.test(markdown)) {
    const breakdownSection = markdown.split(/DESGLOSE[^\n]*\n/i)[1] || '';
    const simpleLineRegex =
      /^\s*(?:\d+[.)]|\*|-)\s*([^\n-]+?)(?:\s*\(([^)]*)\))?(?:\s*-\s*(?:Cantidad(?:\s+consumida)?:?\s*)?([\d.]+)\s*([a-zA-Z%]*))?$/gim;
    let sMatch: RegExpExecArray | null;
    while ((sMatch = simpleLineRegex.exec(breakdownSection)) !== null) {
      const name = sMatch[1].trim();
      if (name && !name.startsWith('#') && !name.startsWith('-')) {
        items.push({
          name,
          brand: sMatch[2]?.trim() || 'General',
          amount: Number(sMatch[3]) || 1,
          unit: sMatch[4]?.trim() || 'porción',
          calories: 0,
          proteinGrams: 0,
          fatsGrams: 0,
          carbsGrams: 0
        });
      }
    }
  }

  // Unificación obligatoria: si el reporte no contiene desglose numerado de ingredientes
  // pero sí cuenta con información nutricional del plato, sintetizar la entrada del plato registrado
  // para que la interfaz siempre lo muestre formateado y unificado como lista (sin bloques de código Markdown)
  if (items.length === 0 && (calories > 0 || proteinGrams > 0 || carbsGrams > 0 || fatsGrams > 0)) {
    items.push({
      name: title || 'Plato registrado',
      brand: 'Plato registrado',
      amount: 1,
      unit: 'porción',
      calories,
      proteinGrams,
      fatsGrams,
      carbsGrams
    });
  }

  return {
    title,
    macros: {
      calories,
      proteinGrams,
      fatsGrams,
      carbsGrams
    },
    items
  };
}

/**
 * Formatea una fecha YYYY-MM-DD y hora HH:mm en formato DD/MM/YYYY HH:mm
 * tal como se almacena en Firestore users/{username}/reports (ej. "01/11/2026 09:40").
 */
export function formatReportTimestamp(dateStr: string, timeStr = ''): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  const timeFormatted = timeStr ? ` ${timeStr.trim()}` : '';
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    return `${dd.padStart(2, '0')}/${mm.padStart(2, '0')}/${yyyy}${timeFormatted}`;
  }
  return `${dateStr}${timeFormatted}`;
}

/**
 * Parsea un timestamp de Firestore (ej: "01/11/2026 09:40", objeto Firestore Timestamp o epoch numérico)
 * a objeto con fecha YYYY-MM-DD y hora exacta HH:mm retornada por el alimento/reporte.
 * NUNCA inventa una hora genérica. Si no hay hora en el timestamp retorna string vacío "".
 */
export function parseReportTimestamp(ts?: unknown): { date: string; time: string } {
  if (ts === undefined || ts === null || ts === '') {
    return { date: '', time: '' };
  }

  // 1. Objeto Firestore Timestamp { seconds, nanoseconds } o { _seconds, _nanoseconds }
  if (typeof ts === 'object' && ts !== null) {
    const obj = ts as { seconds?: number; _seconds?: number };
    const sec = obj.seconds ?? obj._seconds;
    if (typeof sec === 'number') {
      const d = new Date(sec * 1000);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
      }
    }
  }

  // 2. Epoch numérico (milisegundos o segundos)
  const str = String(ts)
    .replace(/^['"]|['"]$/g, '')
    .trim();
  if (/^\d{10,13}$/.test(str)) {
    const num = Number(str);
    const ms = str.length === 10 ? num * 1000 : num;
    const d = new Date(ms);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
    }
  }

  // 3. Formato DD/MM/YYYY o DD/MM/YYYY HH:mm[:ss] o DD/MM/YYYY, HH:mm[:ss]
  const dmyMatch = str.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[,\s]+(\d{1,2}:\d{2})(?::\d{2})?)?/
  );
  if (dmyMatch) {
    const dd = dmyMatch[1].padStart(2, '0');
    const mm = dmyMatch[2].padStart(2, '0');
    const yyyy = dmyMatch[3];
    const time = dmyMatch[4] || '';
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time
    };
  }

  // 4. Formato YYYY-MM-DD o YYYY-MM-DD HH:mm[:ss] o ISO (2026-11-01T09:40:00Z)
  const ymdMatch = str.match(
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:[,\sT]+(\d{1,2}:\d{2})(?::\d{2})?)?/
  );
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    const time = ymdMatch[4] || '';
    return {
      date: `${yyyy}-${mm}-${dd}`,
      time
    };
  }

  return { date: '', time: '' };
}
