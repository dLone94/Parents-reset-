import type { LoadCategory } from "@/types/load";
import type { PlanItem } from "@/types/reset";

/** Maps a reset load area to a Family Load area. Health and "other" land on Me. */
export function areaToLoadCategory(area: PlanItem["area"] | undefined): LoadCategory {
  switch (area) {
    case "kids":
    case "money":
    case "work":
    case "home":
    case "relationship":
      return area;
    default:
      return "me";
  }
}
