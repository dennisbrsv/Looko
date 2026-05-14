// Widget detection utility supporting EN, DE, FR, ES, RU

export default function detectWidget(query) {
  if (!query || typeof query !== "string") return null;
  const q = query.trim();
  if (!q) return null;

  // 1. Math / Function / Desmos Graph detection
  const isFunctionKeywords = /sin\(|cos\(|tan\(|asin\(|acos\(|atan\(|sqrt\(|log\(|log\d+\(|ln\(|abs\(|exp\(|derivative|integral|d\/dx|ableitung|dérivée|derivada|производная|plot|graph|desmos|zeichne|trace|graficar|график|построй график/i.test(q);
  // Match expressions with x variable (clearly graphable)
  const hasVariable = /\bx\b/.test(q) && /[-+*/^=]/.test(q);
  // Match a purely mathematical string (digits, operators, parens) - but not plain numbers or years
  const isPureMath = /^[\d.πe\s()+\-*/^%]+$/.test(q) && /[-+*/^%]/.test(q) && !/^\d{1,4}$/.test(q) && !/\bx\b/.test(q);

  if (isFunctionKeywords || hasVariable) {
    let expression = q;
    
    // Clean up graph/plot keywords if explicitly prefixed
    const desmosRegex = /^(?:plot|graph|desmos|zeichne|trace|graficar|график|построй график)\s*(?:[:\-]?\s*)?(.*)/i;
    const desmosMatch = expression.match(desmosRegex);
    if (desmosMatch && desmosMatch[1].trim()) {
      expression = desmosMatch[1].trim();
    }

    // Handle derivatives written like "2x^3 ableitung" or "derivative of 2x^2"
    const derivMatch = expression.match(/(.*?)\b(derivative|d\/dx|ableitung|dérivée|derivada|производная)\b(?: of| von| de| от)?\s*(.*)/i);
    if (derivMatch && (derivMatch[1].trim() || derivMatch[3].trim())) {
      const exprPart = (derivMatch[1].trim() || derivMatch[3].trim());
      expression = `d/dx(${exprPart})`;
    }
    
    let label = "Graph";
    if (/[äöüß]|ableitung|zeichne/i.test(q)) label = "Diagramm";
    else if (/é|è|dérivée|trace/i.test(q)) label = "Graphique";
    else if (/derivada|graficar/i.test(q)) label = "Gráfico";
    else if (/[а-яА-Я]/.test(q)) label = "График";
    
    return { type: "desmos", expression, label };
  }

  // 1b. Basic calculator for pure arithmetic (no variables)
  if (isPureMath) {
    try {
      // Evaluate safely using Function constructor (no x variable = just arithmetic)
      const sanitized = q.replace(/π/g, 'Math.PI').replace(/e(?!x)/g, 'Math.E').replace(/\^/g, '**');
      // Only allow digits, operators, parens, Math, dots, spaces
      if (/^[0-9+\-*/().%\s^*Math.PIE]+$/.test(sanitized)) {
        const result = new Function(`"use strict"; return (${sanitized})`)();
        if (typeof result === 'number' && isFinite(result)) {
          return { type: "calculator", expression: q, result: String(result), label: "Calculator" };
        }
      }
    } catch {
      // Fall through - not a valid math expression
    }
  }

  // 2. Map detection — require actual location text after keyword
  const mapRegex = /\b(map of|where is|location of|karte von|wo ist|carte de|où est|ou est|dónde está|donde esta|где|карта)\b\s+(.+)/i;
  const mapMatch = q.match(mapRegex);
  if (mapMatch && mapMatch[2].trim().length > 1) {
    const location = mapMatch[2].trim();
    let label = "Map";
    if (/karte|wo ist/i.test(q)) label = "Karte";
    else if (/carte|où|ou est/i.test(q)) label = "Carte";
    else if (/mapa|donde|dónde/i.test(q)) label = "Mapa";
    else if (/[а-яА-Я]/.test(q)) label = "Карта";
    return { type: 'map', location, label };
  }

  // Also match "Paris map" / "Berlin mapa" (location then keyword)
  const mapSuffixRegex = /^(.+?)\s+(map|mapa|karte|carte|карта)\s*$/i;
  const mapSuffixMatch = q.match(mapSuffixRegex);
  if (mapSuffixMatch && mapSuffixMatch[1].trim().length > 1) {
    const location = mapSuffixMatch[1].trim();
    const kw = mapSuffixMatch[2].toLowerCase();
    let label = "Map";
    if (kw === 'karte') label = "Karte";
    else if (kw === 'carte') label = "Carte";
    else if (kw === 'mapa') label = "Mapa";
    else if (kw === 'карта') label = "Карта";
    return { type: 'map', location, label };
  }

  return null;
}
