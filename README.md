# ArduinoCloud_ChatGPT-integration
A private project for integrating the Arduino Cloud and ChatGPT using NodeJS.

The project fakes persistency in memory, by appending every answer to a conversationlog. 

The entire conversation log is sent with every prompt. What this means in practice is that you are able to hold conversation with it, just like on ChatGPT. Without this feature every message is like starting a new chat on chat.openai.com.

You are able to, by telling it to, turn on and off boolean variables for example controlling lights in various rooms.

## To install

This project requires NodeJS to be installed on your system.

Install the dependencies
```
npm install arduino-iot-js
```

```
npm install openai
```
## API keys

In your OpenAI account, create a new API key, and add some credits to your account. (Calling the API is not expensive). Add the newly created API key in the `.env` file.

You will need to set up a manual device in the Arduino Cloud, and get the secret key and the device ID, and place them in the `.env` file 

You are also required to configure a Thing in the Arduino cloud, that has a String variable named `prompt`, and booleans named `livingroom`, `kitchen`, `bathroom`, and `desklight`.

Configure the device in the Cloud as a manually configured device, and replace the value for `deviceId`, and `secretKey` with your own. 

Acquire an OpenAI API key and replace the one in the code with it as well.


## Start 

```
node main.mjs
```
### Tweak behaviour
To tweak the behaviour of the chatbot, you can change the contents of the system message.

```
    { role: "system", content: 'Put your custom instructions here' },

```
 
