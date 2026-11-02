"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DatePeriodPickerProps = {
  endDate: string;
  label?: string;
  onChange: (startDate: string, endDate: string) => void;
  startDate: string;
};

type DatePreset = {
  label: string;
  range: () => [string, string];
};

const WEEKDAYS = ["S", "T", "Q", "Q", "S", "S", "D"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Mar\u00e7o",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

function parseIsoDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function dateToIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, amount: number) {
  const date = parseIsoDate(value) ?? new Date();
  date.setUTCDate(date.getUTCDate() + amount);
  return dateToIso(date);
}

function startOfWeek(value: string) {
  const date = parseIsoDate(value) ?? new Date();
  const day = date.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + offset);
  return dateToIso(date);
}

function endOfWeek(value: string) {
  return addDays(startOfWeek(value), 6);
}

function startOfMonth(value: string) {
  const date = parseIsoDate(value) ?? new Date();
  return dateToIso(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
}

function endOfMonth(value: string) {
  const date = parseIsoDate(value) ?? new Date();
  return dateToIso(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)));
}

function formatDate(value: string) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function todayIsoDate() {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
    year: "numeric"
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function calendarDays(month: Date) {
  const firstDay = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1));
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;
  const firstVisibleDay = new Date(firstDay);
  firstVisibleDay.setUTCDate(firstVisibleDay.getUTCDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDay);
    date.setUTCDate(firstVisibleDay.getUTCDate() + index);
    return date;
  });
}

export default function DatePeriodPicker({
  endDate,
  label = "Periodo",
  onChange,
  startDate
}: DatePeriodPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const today = todayIsoDate();
  const initialMonth = parseIsoDate(startDate || endDate || today) ?? new Date();
  const [open, setOpen] = useState(false);
  const [draftStart, setDraftStart] = useState(startDate || today);
  const [draftEnd, setDraftEnd] = useState(endDate || startDate || today);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(Date.UTC(initialMonth.getUTCFullYear(), initialMonth.getUTCMonth(), 1))
  );

  useEffect(() => {
    if (open) return;
    const nextStart = startDate || today;
    const nextEnd = endDate || nextStart;
    const nextMonth = parseIsoDate(nextStart) ?? new Date();
    setDraftStart(nextStart);
    setDraftEnd(nextEnd);
    setVisibleMonth(new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), 1)));
  }, [endDate, open, startDate, today]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const days = useMemo(() => calendarDays(visibleMonth), [visibleMonth]);
  const presets = useMemo<DatePreset[]>(
    () => [
      { label: "Hoje", range: () => [today, today] },
      { label: "Ontem", range: () => [addDays(today, -1), addDays(today, -1)] },
      { label: "\u00daltimos 7 Dias", range: () => [addDays(today, -6), today] },
      { label: "Semana Atual", range: () => [startOfWeek(today), endOfWeek(today)] },
      {
        label: "\u00daltima Semana",
        range: () => [addDays(startOfWeek(today), -7), addDays(endOfWeek(today), -7)]
      },
      { label: "Este M\u00eas", range: () => [startOfMonth(today), endOfMonth(today)] }
    ],
    [today]
  );

  const periodLabel =
    startDate && endDate && startDate !== endDate
      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
      : formatDate(startDate || endDate) || "Selecionar data";

  function selectDay(value: string) {
    if (!draftStart || draftEnd) {
      setDraftStart(value);
      setDraftEnd("");
      return;
    }

    if (value < draftStart) {
      setDraftStart(value);
      setDraftEnd(draftStart);
      return;
    }

    setDraftEnd(value);
  }

  function applyPreset(preset: DatePreset) {
    const [nextStart, nextEnd] = preset.range();
    const nextMonth = parseIsoDate(nextStart);
    setDraftStart(nextStart);
    setDraftEnd(nextEnd);
    if (nextMonth) {
      setVisibleMonth(new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), 1)));
    }
  }

  function confirmSelection() {
    const nextStart = draftStart || draftEnd || today;
    const nextEnd = draftEnd || nextStart;
    const orderedStart = nextStart <= nextEnd ? nextStart : nextEnd;
    const orderedEnd = nextStart <= nextEnd ? nextEnd : nextStart;
    onChange(orderedStart, orderedEnd);
    setOpen(false);
  }

  function resetToToday() {
    setDraftStart(today);
    setDraftEnd(today);
    onChange(today, today);
    setOpen(false);
  }

  function changeMonth(offset: number) {
    setVisibleMonth(
      (current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + offset, 1))
    );
  }

  return (
    <label className="date-period-field">
      <span>{label}</span>
      <div className="date-period-picker" ref={rootRef}>
        <div className="date-period-control">
          <button
            aria-expanded={open}
            aria-haspopup="dialog"
            className="date-period-trigger"
            onClick={() => setOpen((current) => !current)}
            type="button"
          >
            <span className="date-period-icon" aria-hidden="true" />
            <span>{periodLabel}</span>
          </button>
          <button
            aria-label="Restaurar periodo para hoje"
            className="date-period-clear"
            onClick={resetToToday}
            type="button"
          >
            x
          </button>
        </div>

        {open && (
          <div aria-label="Selecionar periodo" className="date-period-popover" role="dialog">
            <div className="date-period-presets">
              {presets.map((preset) => (
                <button key={preset.label} onClick={() => applyPreset(preset)} type="button">
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="date-period-calendar">
              <div className="date-period-month-head">
                <button aria-label="Mes anterior" onClick={() => changeMonth(-1)} type="button">
                  {"<"}
                </button>
                <strong>
                  {MONTHS[visibleMonth.getUTCMonth()]} {visibleMonth.getUTCFullYear()}
                </strong>
                <button aria-label="Proximo mes" onClick={() => changeMonth(1)} type="button">
                  {">"}
                </button>
              </div>

              <div className="date-period-weekdays" aria-hidden="true">
                {WEEKDAYS.map((day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                ))}
              </div>

              <div className="date-period-days">
                {days.map((day) => {
                  const value = dateToIso(day);
                  const selected = value === draftStart || value === draftEnd;
                  const inRange = Boolean(draftStart && draftEnd && value > draftStart && value < draftEnd);
                  const outside = day.getUTCMonth() !== visibleMonth.getUTCMonth();
                  return (
                    <button
                      aria-label={formatDate(value)}
                      aria-pressed={selected}
                      className={`${outside ? "outside" : ""} ${selected ? "selected" : ""} ${inRange ? "in-range" : ""}`.trim()}
                      key={value}
                      onClick={() => selectDay(value)}
                      type="button"
                    >
                      {day.getUTCDate()}
                    </button>
                  );
                })}
              </div>

              <div className="date-period-footer">
                <span>
                  {formatDate(draftStart)}
                  {draftEnd && draftEnd !== draftStart ? ` - ${formatDate(draftEnd)}` : ""}
                </span>
                <button onClick={confirmSelection} type="button">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </label>
  );
}
