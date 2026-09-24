import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export default function SelectPrecificaCont({
  value,
  onChange,
  options = [],
  placeholder = "Selecione",
  className = "",
  disabled = false,
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!aberto) return;

    const fecharAoClicarFora = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setAberto(false);
      }
    };

    const fecharComEsc = (event) => {
      if (event.key === "Escape") setAberto(false);
    };

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEsc);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEsc);
    };
  }, [aberto]);

  const itens = options.map((item) =>
    typeof item === "string" ? { value: item, label: item } : item
  );

  const atual = itens.find(
    (item) => String(item.value) === String(value)
  );

  const hoverEntrar = (event) => {
    event.currentTarget.style.backgroundColor = "#18304f";
    event.currentTarget.style.color = "#ffffff";
  };

  const hoverSair = (event, selecionado = false) => {
    event.currentTarget.style.backgroundColor = selecionado
      ? "#2563eb"
      : "transparent";
    event.currentTarget.style.color = selecionado ? "#ffffff" : "";
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        className={`${className} flex items-center justify-between gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60`}
        onClick={() => !disabled && setAberto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
      >
        <span className={atual ? "" : "text-slate-400"}>
          {atual?.label || placeholder}
        </span>

        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform ${
            aberto ? "rotate-180" : ""
          }`}
        />
      </button>

      {aberto && !disabled && (
        <div
          role="listbox"
          className="absolute z-[150] mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0c1a2f]"
        >
          {placeholder && (
            <button
              type="button"
              className="block w-full px-3 py-2.5 text-left text-sm text-slate-700 dark:text-white"
              onMouseEnter={hoverEntrar}
              onMouseLeave={(event) => hoverSair(event, false)}
              onClick={() => {
                onChange("");
                setAberto(false);
              }}
            >
              {placeholder}
            </button>
          )}

          {itens.map((item) => {
            const selecionado =
              String(item.value) === String(value);

            return (
              <button
                type="button"
                key={String(item.value)}
                className={`block w-full px-3 py-2.5 text-left text-sm transition ${
                  selecionado
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 dark:text-white"
                }`}
                onMouseEnter={hoverEntrar}
                onMouseLeave={(event) =>
                  hoverSair(event, selecionado)
                }
                onClick={() => {
                  onChange(item.value);
                  setAberto(false);
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
