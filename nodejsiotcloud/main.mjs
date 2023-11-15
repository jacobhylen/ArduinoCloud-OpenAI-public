import { ArduinoIoTCloud } from "arduino-iot-js";
import { OpenAI } from "openai";

import dotenv from 'dotenv';
dotenv.config();

//Variables that hold values that the chatbot can read from the Cloud.
let inputVar = 0;
let variableAsString = 0;

(async () => {
  const client = await ArduinoIoTCloud.connect({
    deviceId: process.env.ARDUINO_CLOUD_DEVICEID,
    secretKey: process.env.ARDUINO_CLOUD_SECRETKEY,
    onDisconnect: (message) => console.error(message),
  });

  // Initial message to be displayed in the messaging widget.
  let value = "Establishing connection to ChatGPT... Please confirm.";
  let cloudVar = "prompt";

  // Store the conversation in a log, to be appended to every prompt - giving the illusion of persistent memory in conversations.
  let conversationLog = [
    { role: "system", content: 'You are my home assistant. you are able to trigger my smart devices with how you respond - which makes you following the format I give you extremely important, for EVERY message you send me, do not add or remove anything from the format ever:"livingroom: 1 kitchen: 1 bathroom: 1 desklight: 1 ¶ Sure, I turned [kitchen] [on/off] "If I ask you to turn something off, you set it to 0, if I ask you to turn it on, you set it to 1. Remember, ALWAYS follow this format, no matter what. You should always list all of the devices in the beginning your response. You are also able to read variable data that is appended to my messages in the "vars" section. Even when reporting on varialbes you should list the status of everything else as well.' },
  ];

  
  client.sendProperty(cloudVar, value);
  console.log(cloudVar, ":", value);


  client.onPropertyValue("test_variable", async (inputVar) => {
    console.log(inputVar.toString());
    variableAsString = inputVar.toString();
  });

  //This Arrow function is executed every time there is new information in the Cloud.
  client.onPropertyValue(cloudVar, async (value) => {

    // Because of how the messenger widget works, the "value" variable needs to hold the values of both the messages sent and received. 
    // This line checks if a function trigger is because of a response from the chatbot, and blocks the function from becoming recursive. Chatbot should not talk to itself. :)
    if (value != chatCompletion.choices[0].message.content) {

      console.log("Message received, awaiting response from OpenAI...")

      
      let messageToSend = value + " ¶ FanSpeed: " + variableAsString + " SecondVar: " + secondValue;
      console.log(messageToSend);

      // Add user messages to the Log.
      conversationLog.push({
        role: "user",
        content: messageToSend,
      });

      // Get an answer to the user message, sending the entire Log.
      chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: conversationLog,
      });

      // Add Assistant messages to the Log.
      conversationLog.push({
        role: "assistant",
        content: chatCompletion.choices[0].message.content
      });
      // For debugging, show the conversation locally before sending it to the Cloud
      console.log(conversationLog);

      // Send the assistant message to the Cloud 
      client.sendProperty(cloudVar, chatCompletion.choices[0].message.content);

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
        } else if(appliances[0].status === 0){
          client.sendProperty("livingroom", 0);
        }
        if(appliances[1].status === 1){
          client.sendProperty("kitchen", 1);
        } else if(appliances[0].status === 0){
          client.sendProperty("kitchen", 0);
        }
        if(appliances[2].status === 1){
          client.sendProperty("bathroom", 1);
        } else if(appliances[0].status === 0){
          client.sendProperty("bathroom", 0);
        }
        if(appliances[3].status === 1){
          client.sendProperty("desklight", 1);
        } else if(appliances[0].status === 0){
          client.sendProperty("desklight", 0);
        }

      }

      // client.sendProperty("kitchen", appliances[1].status);
      // client.sendProperty("bathroom", appliances[2].status);
      // client.sendProperty("desklight", appliances[3].status);
     
    } else {
      console.log("Chatbot is talking to itself.");
    }
  });

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

  console.log(chatCompletion.choices[0].message);

  value = chatCompletion.choices[0].message.content;
  client.sendProperty("prompt", value);
  //client.onPropertyValue(cloudVar, (value) => sendPrompt(value));
})();
