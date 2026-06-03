"""Convert AW26 Operational Plan Excel to pivot-ready JSON."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
EXCEL_PATH = ROOT / "AW26 Operational Plan June 2026.xlsx"
OUTPUT_PATH = ROOT / "dashboard" / "public" / "data" / "plan.json"
TABLE_PATH = ROOT / "dashboard" / "public" / "data" / "table.json"
META_PATH = ROOT / "dashboard" / "public" / "data" / "meta.json"

SIZE_COLUMNS = ["1XS", "2S", "3M", "4L", "5XL", "6XXL", "7XXXL"]
SEASON_COLUMNS = ["Older", "CS-1", "CS", "CS+1"]


def load_excel() -> pd.DataFrame:
    df = pd.read_excel(EXCEL_PATH, sheet_name="Sheet1", header=1)
    df.columns = [str(c).strip() for c in df.columns]
    df["Grade"] = df["Grade"].astype(str).str.strip()
    df["Site_Code"] = df["Site_Code"].astype(str).str.strip()
    df["Month"] = pd.to_numeric(df["Month"], errors="coerce").astype("Int64")
    return df


def build_records(df: pd.DataFrame) -> list[dict]:
    soh_cols = [f"{size}.1" for size in SIZE_COLUMNS]
    season_soh_cols = [f"{season}.1" for season in SEASON_COLUMNS]
    records: list[dict] = []

    for _, row in df.iterrows():
        base = {
            "Tag": str(row["Tag"]),
            "Site_Code": row["Site_Code"],
            "Month": int(row["Month"]) if pd.notna(row["Month"]) else None,
            "Grade": row["Grade"],
            "Category": row["Category"],
            "Target_Store_Month": float(row["$ Target (Store-Month)"] or 0),
            "Sales_Units_Row": float(row["Sales Units"] or 0),
            "Total_SOH_Units_Row": float(row["Total SOH Units"] or 0),
        }

        records.append(
            {
                **base,
                "Grain": "Base",
                "Size": None,
                "Season": None,
                "Sales_Units_By_Size": None,
                "SOH_Units_By_Size": None,
                "Season_Sales_Units": None,
                "Season_SOH_Units": None,
            }
        )

        for idx, size in enumerate(SIZE_COLUMNS):
            records.append(
                {
                    **base,
                    "Grain": "Size",
                    "Size": size,
                    "Season": None,
                    "Target_Store_Month": None,
                    "Sales_Units_Row": None,
                    "Total_SOH_Units_Row": None,
                    "Sales_Units_By_Size": float(row[size] or 0),
                    "SOH_Units_By_Size": float(row[soh_cols[idx]] or 0),
                    "Season_Sales_Units": None,
                    "Season_SOH_Units": None,
                }
            )

        for idx, season in enumerate(SEASON_COLUMNS):
            records.append(
                {
                    **base,
                    "Grain": "Season",
                    "Size": None,
                    "Season": season,
                    "Target_Store_Month": None,
                    "Sales_Units_Row": None,
                    "Total_SOH_Units_Row": None,
                    "Sales_Units_By_Size": None,
                    "SOH_Units_By_Size": None,
                    "Season_Sales_Units": float(row[season] or 0),
                    "Season_SOH_Units": float(row[season_soh_cols[idx]] or 0),
                }
            )

    return records


def build_table_rows(df: pd.DataFrame) -> list[dict]:
    soh_cols = [f"{size}.1" for size in SIZE_COLUMNS]
    season_soh_cols = [f"{season}.1" for season in SEASON_COLUMNS]
    rows: list[dict] = []

    for _, row in df.iterrows():
        rows.append(
            {
                "Tag": str(row["Tag"]),
                "Site_Code": row["Site_Code"],
                "Month": int(row["Month"]) if pd.notna(row["Month"]) else None,
                "Grade": row["Grade"],
                "Category": row["Category"],
                "Target": float(row["$ Target (Store-Month)"] or 0),
                "Sales_Units": float(row["Sales Units"] or 0),
                "Total_SOH_Units": float(row["Total SOH Units"] or 0),
                "Sales_By_Size": {size: float(row[size] or 0) for size in SIZE_COLUMNS},
                "SOH_By_Size": {
                    size: float(row[soh_cols[idx]] or 0)
                    for idx, size in enumerate(SIZE_COLUMNS)
                },
                "Season_Sales": {
                    season: float(row[season] or 0) for season in SEASON_COLUMNS
                },
                "Season_SOH": {
                    season: float(row[season_soh_cols[idx]] or 0)
                    for idx, season in enumerate(SEASON_COLUMNS)
                },
            }
        )

    return rows


def build_meta(df: pd.DataFrame, records: list[dict]) -> dict:
    size_records = [r for r in records if r["Grain"] == "Size"]
    season_records = [r for r in records if r["Grain"] == "Season"]

    size_totals = {size: 0.0 for size in SIZE_COLUMNS}
    for record in size_records:
        size_totals[record["Size"]] += record["Sales_Units_By_Size"] or 0

    season_totals = {season: 0.0 for season in SEASON_COLUMNS}
    for record in season_records:
        season_totals[record["Season"]] += record["Season_Sales_Units"] or 0

    return {
        "source_file": EXCEL_PATH.name,
        "row_count_raw": int(len(df)),
        "row_count_pivot": len(records),
        "dimensions": {
            "Site_Code": sorted(df["Site_Code"].dropna().unique().tolist()),
            "Month": sorted(int(v) for v in df["Month"].dropna().unique().tolist()),
            "Grade": sorted(df["Grade"].dropna().unique().tolist()),
            "Category": sorted(df["Category"].dropna().unique().tolist()),
            "Size": SIZE_COLUMNS,
            "Season": SEASON_COLUMNS,
            "Grain": ["Base", "Size", "Season"],
        },
        "metrics": [
            "Sales_Units_By_Size",
            "SOH_Units_By_Size",
            "Season_Sales_Units",
            "Season_SOH_Units",
            "Target_Store_Month",
            "Sales_Units_Row",
            "Total_SOH_Units_Row",
        ],
        "verification": {
            "sales_units_row_total": float(df["Sales Units"].sum()),
            "sales_units_by_size_total": float(sum(size_totals.values())),
            "sales_units_delta": float(df["Sales Units"].sum() - sum(size_totals.values())),
            "season_sales_total": float(sum(season_totals.values())),
            "season_sales_row_total": float(
                sum(float(row[season] or 0) for _, row in df.iterrows() for season in SEASON_COLUMNS)
            ),
            "total_soh_row_total": float(df["Total SOH Units"].sum()),
            "target_store_month_total": float(df["$ Target (Store-Month)"].sum()),
            "size_breakdown": size_totals,
            "season_breakdown": season_totals,
        },
    }


def main() -> None:
    df = load_excel()
    records = build_records(df)
    table_rows = build_table_rows(df)
    meta = build_meta(df, records)

    data_dir = OUTPUT_PATH.parent
    data_dir.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(records), encoding="utf-8")
    TABLE_PATH.write_text(json.dumps(table_rows), encoding="utf-8")
    META_PATH.write_text(json.dumps(meta, indent=2), encoding="utf-8")

    excel_public = data_dir / EXCEL_PATH.name
    shutil.copy2(EXCEL_PATH, excel_public)

    print(f"Wrote {len(records):,} records to {OUTPUT_PATH}")
    print(f"Wrote {len(table_rows):,} table rows to {TABLE_PATH}")
    print(f"Wrote metadata to {META_PATH}")
    print(f"Copied Excel to {excel_public}")


if __name__ == "__main__":
    main()
