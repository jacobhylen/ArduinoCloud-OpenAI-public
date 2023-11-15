
import { ArduinoIoTCloud } from "arduino-iot-js";
import { OpenAI } from "openai";

// Lets us save the API keys in the .env file
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
});

let chatCompletion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "user",
      content: "Establishing connection to ChatGPT... Please confirm.",
    },
  ],
});

(async () => {
  const client = await ArduinoIoTCloud.connect({
    deviceId: process.env.ARDUINO_CLOUD_DEVICEID,
    secretKey: process.env.ARDUINO_CLOUD_SECRETKEY,
    onDisconnect: (message) => console.error(message),
  });

  // Initial message to be displayed in the messaging widget.
  let value = "Establishing connection to ChatGPT... Please confirm.";
  let cloudVar = "prompt";

  client.sendProperty(cloudVar, value);
  console.log(cloudVar, ":", value);
  
  // Store the conversation in a log, to be appended to every prompt - giving the illusion of persistent memory in conversations.
  let conversationLog = [
    { role: "system", content: 'Always answer me in Spanish' },
  ];
  
  //This is how to receive information from a variable in the Cloud
  client.onPropertyValue(cloudVar, async (value) => {
    if (value != chatCompletion.choices[0].message.content) {

      // Add user messages to the Log
      conversationLog.push({
        role: "user",
        content: value,
      });

      chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: conversationLog,
      });

      console.log(chatCompletion.choices[0].message);
      conversationLog.push({
        role: "assistant",
        content: chatCompletion.choices[0].message.content
      });
      console.log(conversationLog);

      client.sendProperty(cloudVar, chatCompletion.choices[0].message.content);
    } else {
      console.log("first triggered second failed");
    }
  });

  value = chatCompletion.choices[0].message.content;
  client.sendProperty("prompt", value);
  //client.onPropertyValue(cloudVar, (value) => sendPrompt(value));
})();