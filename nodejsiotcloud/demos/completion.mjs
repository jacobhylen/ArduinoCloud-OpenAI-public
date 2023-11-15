import {ArduinoIoTCloud} from "arduino-iot-js";
import {OpenAI } from "openai";

// Lets us save the API keys in the .env file
import dotenv from 'dotenv';
dotenv.config();

// Set up the OpenAI Stuff
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, 
});

// Global definition needed for reasons, not super DRY code 
let chatCompletion = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [{"role": "user", "content": 'Establishing connection to ChatGPT... Please confirm.'}],
});

(async () => {
  const client = await ArduinoIoTCloud.connect({
    deviceId: process.env.ARDUINO_CLOUD_DEVICEID,
    secretKey: process.env.ARDUINO_CLOUD_SECRETKEY,
    onDisconnect: (message) => console.error(message),
  });

  //This one is for sending to the Cloud, the identical text above is sent to the OpenAI API
  let value = "Establishing connection to ChatGPT... Please confirm.";
  let cloudVar = "prompt"

  // So should this probably
  client.sendProperty(cloudVar, value);
  console.log(cloudVar, ":", value);

  //This is how to receive information from a variable in the Cloud
  client.onPropertyValue(cloudVar, async (value) => {
    if(value != chatCompletion.choices[0].message.content){ 
    // Sometimes the function gets triggered by the chatbot sending a message, which would prompt a new answer. 
    // This conditional keeps the function from becoming recursive.
    
      // Request a chat completion
      chatCompletion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{"role": "user", "content": value}],
        });
        
        console.log(chatCompletion.choices[0].message)
        
        // Update the cloud Variable with the chatbots reply
        client.sendProperty(cloudVar,  chatCompletion.choices[0].message.content);
 
}
else{
  console.log("first triggered second failed"); // This means chatbot is talking to itself :)
}
});
  console.log(chatCompletion.choices[0].message)
  
  value  = chatCompletion.choices[0].message.content;
  client.sendProperty("prompt", value);
  //client.onPropertyValue(cloudVar, (value) => sendPrompt(value));

})();