# Zoom Meeting AI Transcription Agent

This NodeJS application automates the process of creating a Zoom meeting, having an AI agent join it, transcribing the conversation in real-time, and saving the transcription to a local JSON file named after the meeting ID upon completion.

---

## Workflow & Implementation Details

The process involves the following steps:

### 1. Programmatically Starting a Zoom Meeting

- **Purpose:** To create a new Zoom meeting automatically using the NodeJS application.
- **Method:** This implementation uses the **Zoom REST API** with **Server-to-Server OAuth** for authentication.
- **Implementation (based on provided code):**
  - Uses NodeJS with libraries like `axios` (for HTTP requests) and `dotenv` (for environment variables).
  - **Authentication:**
    - Retrieves an access token by sending a POST request to `https://zoom.us/oauth/token`.
    - Uses the `account_credentials` grant type, requiring `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, and `ZOOM_ACCOUNT_ID` from environment variables.
    - The Client ID and Secret are Base64 encoded for the Authorization header.
  - **Meeting Creation:**
    - Sends an authorized POST request to the `/users/me/meetings` endpoint of the Zoom API (`https://api.zoom.us/v2`).
    - The request header includes the `Bearer` access token obtained previously.
    - The request body specifies meeting details, such as `topic`, `type` (e.g., `2` for an instant meeting), and `settings` (e.g., `join_before_host: true`).
  - **Output:** The function returns the `join_url` for the newly created meeting.
- **Prerequisites:**
  - A Zoom Server-to-Server OAuth app created on the Zoom Marketplace.
  - The app must have the `meetings:write` scope granted.
  - `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, and `ZOOM_ACCOUNT_ID` must be correctly configured in the environment variables (`.env` file).

### 2. Integrating the AI Agent as a Participant

- **Purpose:** To have the AI agent join the created Zoom meeting to listen and transcribe.
- **Method:** The recommended approach is using the **Zoom Meeting SDK for Linux**. This SDK is designed for bots, runs headless (without a GUI) via a command-line interface, and can access raw audio data needed for transcription.
- **Implementation:**
  - The NodeJS program needs to launch an instance of the Linux SDK client in headless mode.
  - Provide the Meeting ID and password (or join URL obtained from Step 1) to the SDK instance to join the specific meeting.
  - The [Linux Headless Bot Sample](https://github.com/zoom/meetingsdk-headless-linux-sample) on GitHub provides a practical example, often run using Docker.
- **Considerations:**
  - **Authorization:** Ensure the Meeting SDK app (created on the Zoom Marketplace) has the necessary SDK credentials (Client ID/Secret). Joining meetings hosted by external organizations might require the SDK app to be published (even as unlisted).
  - **Privacy:** The bot accessing the audio stream might trigger an "allow recording" prompt for participants. This needs to be handled or communicated. Using the Linux SDK's "Raw Data functionality" is key here, as REST API participant management is less suited for active listening bots.

### 3. Real-time Audio Transcription

- **Purpose:** To convert the live audio feed from the meeting into text.
- **Method:** Integrate a real-time audio transcription service or library into the NodeJS application.
- **Options:**
  - **Cloud Services (via WebSockets):**
    - AssemblyAI (NodeJS SDK: `assemblyai`)
    - Amazon Transcribe (NodeJS SDK: `@aws-sdk/client-transcribe-streaming`, requires PCM audio input)
    - Google Cloud Speech-to-Text (NodeJS SDK: `@google-cloud/speech`)
    - Gladia (API-based, requires base64 encoded audio)
- **Considerations:** The choice depends on factors like accuracy, cost, ease of NodeJS integration, specific audio format requirements (see next step), and privacy needs. Upgraded accounts may be needed for real-time features on some cloud services.

### 4. Capturing Audio & Streaming for Transcription

- **Purpose:** To get the raw audio data from the Zoom meeting (via the Linux SDK bot) and send it to the chosen transcription service.
- **Method:**
  - The **Zoom Meeting SDK for Linux** provides "Raw Data functionality" to access the raw audio stream, typically in PCM 16LE format. The Linux headless bot sample demonstrates capturing this audio.
  - **Note:** The Web Meeting SDK _cannot_ access raw audio streams directly; the Linux SDK is necessary for this task.
  - The NodeJS application receives this raw audio data from the running Linux SDK instance.
- **Streaming:**
  - The captured audio (PCM) needs to be streamed to the transcription service.
  - For cloud services, this usually involves establishing a WebSocket connection using the service's NodeJS SDK and sending the audio data in the required format (e.g., PCM chunks for AWS, base64 for Gladia). Potential format conversion within NodeJS might be needed.
- **Considerations:** Efficiently handling the audio stream without performance issues is key.

### 5. Handling the Meeting End Event

- **Purpose:** To reliably detect when the Zoom meeting finishes so the transcription can be saved.
- **Method:** The most effective approach is using **Zoom Webhooks**.
- **Implementation:**
  - Subscribe to the `meeting.ended` webhook event for your Meeting SDK app in the Zoom Marketplace settings. This event triggers when the meeting is deleted or all participants leave.
  - Configure an "Event notification endpoint URL" on your NodeJS server.
  - Implement logic in your NodeJS (e.g., using Express) server to receive the HTTP POST request from Zoom when the event occurs.
  - **Crucially:** Verify the webhook request using the webhook secret token provided by Zoom to ensure authenticity. Sample NodeJS/Express servers for webhook handling are available.
- **Considerations:** The `meeting.ended` webhook might occasionally trigger multiple times; design your application to handle this gracefully (e.g., ensure saving only happens once per meeting ID). Using webhooks is more efficient than polling the Zoom API for meeting status.

### 6. Storing Transcription in JSON Format

- **Purpose:** To persistently store the complete transcription of the meeting once it concludes.
- **Method:** Use NodeJS's built-in `fs` (File System) module.
- **Implementation:**
  - When the `meeting.ended` webhook is received and verified:
    - Retrieve the accumulated final transcription segments (which should have been stored temporarily, e.g., in an array, during the meeting).
    - Retrieve the `meetingId` from the webhook payload.
    - Structure the data into a JSON object. Include the `meetingId`, start/end times, and the array of transcript segments (potentially with timestamps/speaker tags if available).
    - Construct the filename using the meeting ID (e.g., `${meetingId}.json`).
    - Use `fs.writeFileSync()` (synchronous) or `fs.writeFile()` (asynchronous, generally preferred) to write the `JSON.stringify`-ed object to the designated local directory.
- **Output:** A JSON file named after the Zoom Meeting ID.

---

## Configuration

- Set up the NodeJS environment (install NodeJS and npm).
- Create a Zoom Server-to-Server OAuth app (for meeting creation via API) and a Meeting SDK app (for the bot) on the Zoom App Marketplace.
- Configure the apps, enable necessary features (Meeting SDK Embed), and request required scopes (`meetings:write` for API creation, potentially user/meeting scopes for SDK).
- Obtain API credentials (Client ID, Client Secret, Account ID for Server-to-Server OAuth) and SDK credentials (Client ID, Client Secret for Meeting SDK).
- Manage all credentials securely (use environment variables, not hardcoding).
- Configure your chosen Transcription Service credentials securely.
- Set up a webhook endpoint URL in the Zoom app settings and store the webhook secret token securely.
