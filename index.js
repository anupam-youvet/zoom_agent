const axios = require("axios");
const btoa = require("btoa"); // For base64 encoding
require("dotenv").config();

const clientId = process.env.ZOOM_CLIENT_ID;
const clientSecret = process.env.ZOOM_CLIENT_SECRET;
const accountId = process.env.ZOOM_ACCOUNT_ID;
const authTokenUrl = "https://zoom.us/oauth/token";
const apiBaseUrl = "https://api.zoom.us/v2";

async function getAccessToken() {
  const base64Auth = btoa(`${clientId}:${clientSecret}`);
  const config = {
    method: "post",
    url: `${authTokenUrl}?grant_type=account_credentials&account_id=${accountId}`,
    headers: {
      Authorization: `Basic ${base64Auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  try {
    const response = await axios(config);
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

async function createZoomMeeting() {
  try {
    const accessToken = await getAccessToken();
    const config = {
      method: "post",
      url: `${apiBaseUrl}/users/me/meetings`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      data: {
        topic: "My NodeJS Meeting",
        type: 2, // Instant meeting
        settings: {
          join_before_host: true,
          waiting_room: false,
        },
      },
    };

    const response = await axios(config);
    console.log("Meeting created:", response.data);
    return response.data.join_url;
  } catch (error) {
    console.error("Error creating meeting:", error);
    throw error;
  }
}

// Example usage:
createZoomMeeting()
  .then((joinUrl) => {
    if (joinUrl) {
      console.log("Join URL:", joinUrl);
      // You can now redirect your user to this URL
    }
  })
  .catch((err) => console.error(err));
