import { useTheme } from "../theme";

/**
 * MinimalSizeWarning Component
 *
 * Displays a centered "terminal too narrow" message when the terminal
 * width drops below 60 columns. Used by dashboards to gracefully handle
 * minimal terminal sizes.
 */
export default function MinimalSizeWarning() {
  const { colors } = useTheme();

  return (
    <box
      width="100%"
      height="100%"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      gap={1}
    >
      <text fg={colors.error}>Terminal too narrow</text>
      <text fg={colors.textMuted}>Resize to at least 60 columns wide</text>
    </box>
  );
}
