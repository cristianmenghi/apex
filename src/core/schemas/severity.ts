import { z } from "zod";

export const SeverityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
export type Severity = z.infer<typeof SeverityEnum>;

export const severityPreprocess = z.preprocess((val) => {
  if (typeof val === "string") {
    const upper = val.toUpperCase();
    for (const level of SeverityEnum.options) {
      if (upper.includes(level)) return level;
    }
  }
  return val;
}, SeverityEnum);
