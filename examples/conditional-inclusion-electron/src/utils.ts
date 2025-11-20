import { screen } from "electron";

/**
 * Gets the bounds of the currently active display (where cursor is located).
 * Falls back to primary display if cursor position unavailable.
 * @returns Display bounds object with x, y, width, height
 */
export function getActiveDisplayBounds() {
  const cursorPoint = screen.getCursorScreenPoint();
  const activeDisplay = screen.getDisplayNearestPoint(cursorPoint);
  return activeDisplay.workArea;
}

/**
 * Calculates centered position for a window on the active display.
 * @param windowWidth - Width of window to position
 * @param windowHeight - Height of window to position
 * @param offsetX - Optional horizontal offset from center
 * @returns Object with x and y coordinates
 */
export function getCenteredRect({
  width,
  height,
  offsetX = 0,
  offsetY = 0,
}: {
  width: number;
  height: number;
  offsetX?: number;
  offsetY?: number;
}) {
  const displayBounds = getActiveDisplayBounds();
  return {
    width,
    height,
    x: Math.floor(
      displayBounds.x + (displayBounds.width - width) / 2 + offsetX,
    ),
    y: Math.floor(
      displayBounds.y + (displayBounds.height - height) / 2 + offsetY,
    ),
  };
}
