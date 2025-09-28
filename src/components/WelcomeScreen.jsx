
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export default function WelcomeScreen({ onStart }) {
  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <h1>Welcome to the GenBooth Idea Lab</h1>
        <p className="intro">
          Explore university modules, connect with expert AI assistants for each subject, and generate creative project ideas. Select a module from the panel to begin your journey.
        </p>
        <button className="welcome-start-btn" onClick={onStart}>
          Start Exploring
        </button>
      </div>
    </div>
  )
}
