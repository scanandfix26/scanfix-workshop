import { useState } from 'react';

interface Props { onClose: () => void; }

export default function Calculator({ onClose }: Props) {
  const [display, setDisplay] = useState('0');
  const [expr, setExpr] = useState('');
  const [fresh, setFresh] = useState(true);

  const press = (val: string) => {
    if (val === 'C') { setDisplay('0'); setExpr(''); setFresh(true); return; }
    if (val === '⌫') { setDisplay(d => d.length > 1 ? d.slice(0, -1) : '0'); return; }
    if (val === '=') {
      try {
        const result = Function('"use strict"; return (' + expr + display + ')')();
        setDisplay(String(parseFloat(result.toFixed(8))));
        setExpr('');
        setFresh(true);
      } catch { setDisplay('Err'); setExpr(''); setFresh(true); }
      return;
    }
    if (['+', '-', '×', '÷'].includes(val)) {
      const op = val === '×' ? '*' : val === '÷' ? '/' : val;
      setExpr(expr + display + op);
      setFresh(true);
      return;
    }
    if (val === '%') { setDisplay(String(parseFloat(display) / 100)); return; }
    if (fresh) { setDisplay(val === '.' ? '0.' : val); setFresh(false); }
    else {
      if (val === '.' && display.includes('.')) return;
      setDisplay(d => d === '0' && val !== '.' ? val : d + val);
    }
  };

  const buttons = [
    ['C', '⌫', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-t-3xl p-4 pb-8 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400 font-mono truncate">{expr}</span>
          <button onClick={onClose} className="text-gray-400 text-xl p-1">✕</button>
        </div>
        <div className="text-right text-4xl font-bold text-dark mb-4 font-mono pr-2 truncate">{display}</div>
        <div className="grid grid-cols-4 gap-2">
          {buttons.flat().map((btn, i) => (
            <button
              key={i}
              onClick={() => press(btn)}
              className={`h-14 rounded-xl text-xl font-semibold active:scale-95 transition-transform
                ${btn === '0' ? 'col-span-2' : ''}
                ${btn === '=' ? 'bg-yellow text-dark' : ['+', '-', '×', '÷'].includes(btn) ? 'bg-dark text-yellow' : btn === 'C' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-dark'}`}
            >{btn}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
