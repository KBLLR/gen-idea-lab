/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * GazeOverlay - Visual overlay showing eye gaze direction and focus
 * Displays:
 * - Gaze point (where the user is looking)
 * - Gaze vector (direction indicator)
 * - Focus strength (attention level)
 */
export default function GazeOverlay({ gazeData, videoWidth, videoHeight }) {
  if (!gazeData || !gazeData.bearing || !gazeData.strength) {
    return null;
  }

  const { bearing, strength } = gazeData;

  // Convert bearing (yaw/pitch in radians) to screen coordinates
  // bearing typically has: bearing.yaw, bearing.pitch, bearing.roll
  const yaw = bearing.yaw || 0; // horizontal rotation
  const pitch = bearing.pitch || 0; // vertical rotation

  // Calculate gaze point on screen (simplified projection)
  // Center point is where eyes are looking when straight ahead
  const centerX = videoWidth / 2;
  const centerY = videoHeight / 2;

  // Project gaze direction onto screen
  // Negative yaw = looking left, positive = looking right
  // Negative pitch = looking up, positive = looking down
  const gazeX = centerX + (Math.tan(yaw) * videoWidth * 0.5);
  const gazeY = centerY + (Math.tan(pitch) * videoHeight * 0.5);

  // Clamp to video bounds
  const clampedX = Math.max(0, Math.min(videoWidth, gazeX));
  const clampedY = Math.max(0, Math.min(videoHeight, gazeY));

  // Calculate focus color and size based on strength (0-1)
  const focusOpacity = Math.max(0.3, strength);
  const focusSize = 40 + (strength * 30); // 40-70px

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
      viewBox={`0 0 ${videoWidth} ${videoHeight}`}
      preserveAspectRatio="none"
    >
      {/* Gaze direction line from center to gaze point */}
      <line
        x1={centerX}
        y1={centerY}
        x2={clampedX}
        y2={clampedY}
        stroke="#60A5FA"
        strokeWidth="2"
        strokeDasharray="5,5"
        opacity={focusOpacity * 0.7}
      />

      {/* Focus point circle */}
      <circle
        cx={clampedX}
        cy={clampedY}
        r={focusSize / 2}
        fill="none"
        stroke="#60A5FA"
        strokeWidth="3"
        opacity={focusOpacity}
      >
        <animate
          attributeName="r"
          from={focusSize / 2}
          to={focusSize / 2 + 10}
          dur="1.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          from={focusOpacity}
          to={focusOpacity * 0.3}
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Inner focus dot */}
      <circle
        cx={clampedX}
        cy={clampedY}
        r="5"
        fill="#60A5FA"
        opacity={focusOpacity}
      />

      {/* Gaze strength indicator (text) */}
      <text
        x={clampedX}
        y={clampedY - focusSize / 2 - 10}
        fill="#60A5FA"
        fontSize="12"
        fontWeight="600"
        textAnchor="middle"
        opacity={focusOpacity}
      >
        Focus: {Math.round(strength * 100)}%
      </text>
    </svg>
  );
}
