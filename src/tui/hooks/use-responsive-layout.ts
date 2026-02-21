/**
 * Responsive Layout Hook
 *
 * Provides terminal width-based breakpoints and computed layout values.
 * All thresholds are centralized in LAYOUT_CONFIG for easy tuning.
 */

import { useMemo } from "react";
import { useTerminalDimensions } from "@opentui/react";

/**
 * Single place to tune all responsive layout thresholds.
 * All values in character cells.
 */
export const LAYOUT_CONFIG = {
  /** Below this: show "terminal too small" warning */
  minWidth: 60,

  /** Below this: single column, side panels collapse */
  compactMaxWidth: 100,

  /** At or above this: 3 columns for agent grids */
  wideMinWidth: 180,

  /** Discovery panel width in normal mode */
  discoveryPanelWidth: 32,

  /** Discovery panel width in compact collapsed mode */
  discoveryPanelCompactWidth: 5,

  /** Minimum comfortable width for agent cards; below this triggers condensed mode */
  agentCardMinComfortable: 45,
} as const;

/**
 * Breakpoint flags derived from terminal width.
 */
export interface LayoutBreakpoints {
  /** Terminal is too small to render usefully (width < minWidth) */
  minimal: boolean;

  /** Single column, compact layout (width < compactMaxWidth) */
  compact: boolean;

  /** Standard 2-column layout (compactMaxWidth ≤ width < wideMinWidth) */
  standard: boolean;

  /** Wide layout — 3-column grids (width ≥ wideMinWidth) */
  wide: boolean;
}

/**
 * Full responsive layout configuration with computed values.
 * Includes breakpoint flags, column count, panel mode, and content adaptation flags.
 */
export interface ResponsiveLayout extends LayoutBreakpoints {
  /** Terminal width in character cells */
  width: number;

  /** Terminal height in character cells */
  height: number;

  /** Number of columns for agent card grids (1, 2, or 3) */
  agentColumns: 1 | 2 | 3;

  /** Whether side panels should overlay instead of sitting beside content */
  panelMode: "inline" | "overlay";

  /** Whether agent cards should show condensed content */
  compactCards: boolean;
}

/**
 * Hook that reads terminal dimensions and returns a ResponsiveLayout object
 * with breakpoint flags and computed values.
 *
 * @returns ResponsiveLayout object with all breakpoints and computed values
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height } = useTerminalDimensions();

  return useMemo(() => {
    // Compute breakpoint flags
    const minimal = width < LAYOUT_CONFIG.minWidth;
    const compact = width < LAYOUT_CONFIG.compactMaxWidth;
    const standard =
      width >= LAYOUT_CONFIG.compactMaxWidth &&
      width < LAYOUT_CONFIG.wideMinWidth;
    const wide = width >= LAYOUT_CONFIG.wideMinWidth;

    // Compute agentColumns based on breakpoint
    let agentColumns: 1 | 2 | 3;
    if (compact) {
      agentColumns = 1;
    } else if (standard) {
      agentColumns = 2;
    } else {
      agentColumns = 3;
    }

    // Compute panelMode: inline for standard/wide, overlay for compact
    const panelMode: "inline" | "overlay" = compact ? "overlay" : "inline";

    // Compute compactCards: true only when 1-column AND width still tight
    const compactCards = agentColumns === 1 && width < LAYOUT_CONFIG.agentCardMinComfortable;

    return {
      minimal,
      compact,
      standard,
      wide,
      width,
      height,
      agentColumns,
      panelMode,
      compactCards,
    };
  }, [width, height]);
}
