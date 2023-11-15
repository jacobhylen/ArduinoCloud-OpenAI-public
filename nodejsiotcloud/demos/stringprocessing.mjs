

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
    { role: "system", content: 'You are my home assistant. you are able to trigger my smart devices with how you respond - which makes you following the format I give you extremely important, for EVERY message you send me, do not add or remove anything from the format ever:"livingroom: 1 kitchen: 1 bathroom: 1 desklight: 1 ¶ Sure, I turned [kitchen] [on/off] "If I ask you to turn something off, you set it to 0, if I ask you to turn it on, you set it to 1. Remember, ALWAYS follow this format, no matter what. You should always list all of the devices in the beginning your response.' },
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


      // 
      let whichVar = 0;

      // Create an array that will store the appliances that the bot has access to.
      const appliances = [];

      const livingroom = {status: 1};
      const kitchen  = {status: 1};
      const bathroom = {status: 1};
      const desklight = {status: 1};

      appliances.push(livingroom, kitchen, bathroom, desklight);

      // place the chatbots replies in a string to be processed
      let messageInString = chatCompletion.choices[0].message.content;

      for (let i = 0; i < messageInString.length; i++ ){
        
        // Do some string acrobatics to figure out what does what. 
        // The first bit found correlates to the appliance in the first slot in the array
        if(messageInString.slice(i-1, i) === "1"){
          console.log("it was a hit! Turn on appliance " + whichVar);
          appliances[whichVar].status = 1;
          console.log(appliances[whichVar].status);
          
          whichVar ++;
          
        } else if(messageInString.slice(i-1, i) === "0"){
          console.log("it was a hit! Turn off appliance " + whichVar);
          appliances[whichVar].status = 0;
          console.log(appliances[whichVar].status);
          whichVar ++;
        }
      }
      if(whichVar === appliances.length + 1){
        return
      } else{
        
        if(appliances[0].status === 1){
          client.sendProperty("livingroom", 1);
          console.log("test");
        } else if(appliances[0].status === 0){
            client.sendProperty("livingroom", 0);
            console.log("test2");
        }
        if(appliances[1].status === 1){
            client.sendProperty("kitchen", 1);
            console.log("test");
        } else if(appliances[0].status === 0){
            client.sendProperty("kitchen", 0);
            console.log("test2");
        }
        if(appliances[2].status === 1){
            client.sendProperty("bathroom", 1);
            console.log("test");
        } else if(appliances[0].status === 0){
            client.sendProperty("bathroom", 0);
            console.log("test2");
        }
        if(appliances[3].status === 1){
            client.sendProperty("desklight", 1);
            console.log("test");
        } else if(appliances[0].status === 0){
            client.sendProperty("desklight", 0);
            console.log("test2");
        }

      }
    } else {
      console.log("first triggered second failed");
    }
  });

  value = chatCompletion.choices[0].message.content;
  client.sendProperty("prompt", value);
  //client.onPropertyValue(cloudVar, (value) => sendPrompt(value));
})();