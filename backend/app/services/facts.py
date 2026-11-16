"""Факти з інших систем: агрегування за періодом і підрозділом, поріг k."""

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Indicator
from app.services import methodology as m


def month_key(d: date) -> str:
    return f"{d.year:04d}-{d.month:02d}"


def months_back(end: date, count: int) -> list[str]:
    """Список місяців YYYY-MM: `count` місяців, що закінчуються місяцем `end` (включно)."""
    year, month = end.year, end.month
    result = []
    for _ in range(count):
        result.append(f"{year:04d}-{month:02d}")
        month -= 1
        if month == 0:
            year, month = year - 1, 12
    return sorted(result)


def aggregate(db: Session, units: set[uuid.UUID], periods: list[str], k: int) -> list[dict]:
    """Сума numerator/denominator по підрозділах і місяцях для кожного факту.

    Якщо знаменник менший за k, цифри не показуються і в індекс не йдуть:
    вони враховуються лише у вищому підрозділі, де знаменник більший.
    """
    rows = db.scalars(
        select(Indicator).where(Indicator.unit_id.in_(units), Indicator.period.in_(periods))
    ).all() if units and periods else []

    sums: dict[str, dict] = {}
    for row in rows:
        if row.indicator not in m.FACTS:
            continue
        item = sums.setdefault(row.indicator, {"numerator": 0, "denominator": 0, "extra": {}, "sources": set()})
        item["numerator"] += row.numerator
        item["denominator"] += row.denominator
        item["sources"].add(row.source)
        for key, value in (row.extra_counts or {}).items():
            item["extra"][key] = item["extra"].get(key, 0) + value

    result = []
    for code, meta in m.FACTS.items():
        item = sums.get(code)
        if item is None:
            continue
        num, den = item["numerator"], item["denominator"]
        base = {
            "indicator": code,
            "title": meta["title"],
            "component": meta["component"],
            "periods": f"з {periods[0]} по {periods[-1]}",
            "sources": sorted(item["sources"]),
        }
        if den == 0:
            result.append({**base, "status": "no_denominator", "numerator": None, "denominator": None,
                           "percent": None, "level": None, "score": None, "extra_counts": {},
                           "label": f"{meta['title']}: немає даних (знаменник 0)", "rule": "Знаменник 0: факт не враховується."})
            continue
        if den < k:
            result.append({**base, "status": "too_few_people", "numerator": None, "denominator": None,
                           "percent": None, "level": None, "score": None, "extra_counts": {},
                           "label": f"{meta['title']}: замало людей для показу",
                           "rule": f"Знаменник менший за {k}: цифри враховуються лише у вищому підрозділі."})
            continue
        percent = round(100 * num / den, 1)
        level = m.fact_level(code, 100 * num / den)
        result.append(
            {
                **base,
                "status": "ok",
                "numerator": num,
                "denominator": den,
                "percent": percent,
                "level": level,
                "score": (level - 1) * m.POINTS_PER_LEVEL,
                "extra_counts": item["extra"],
                "label": f"{meta['title']}: {meta['denominator']} {den} · {meta['numerator']} {num} · {meta['rest']} {den - num} ({round(percent)}%)",
                "rule": f"{num} з {den} = {percent}% → рівень {level} за порогами {meta['thresholds']} → {(level - 1) * m.POINTS_PER_LEVEL:g} балів.",
            }
        )
    return result
