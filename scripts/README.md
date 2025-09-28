# Thumbnail Generation Script

This script uses the Gemini API to generate a unique thumbnail for every creative mode defined in `src/lib/modes.js`. It uses the `scripts/thumbnail-source.jpg` image as the input for all generations.

## Prerequisites

1.  **Node.js**: Ensure you have a recent version of Node.js installed (v18+ recommended).
2.  **API Key**: You must have a valid Gemini API key.

## Setup

1.  **Install Dependencies**:
    From the root directory of the project, run:
    ```bash
    npm install
    ```

2.  **Create Environment File**:
    Create a file named `.env` in the root directory of the project and add your API key to it:
    ```
    API_KEY=YOUR_GEMINI_API_KEY
    ```

## Running the Script

Once the setup is complete, you can run the script from the project root with the following command:

```bash
npm run generate-thumbnails
```

The script will iterate through all the modes, call the Gemini API for each one, and then overwrite the `src/lib/thumbnails.js` file with the newly generated base64 image data.

The process can take several minutes to complete, as it needs to make an API call for every single mode. Watch the console for progress updates. If any generations fail, they will be saved as empty strings in the output file.
