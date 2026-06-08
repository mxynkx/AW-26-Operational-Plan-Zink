export const MONTH_ORDER = [6, 7, 8, 9, 10, 11, 12, 1, 2, 3] as const;

export const MONTH_LABELS: Record<number, string> = {
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
  1: "January",
  2: "February",
  3: "March",
};

export const GRADE_ORDER = ["1A+", "A", "B", "C", "D", "0"] as const;

export const GRADE_LABELS: Record<string, string> = {
  "1A+": "1A+ Flagship",
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  "0": "0",
};
