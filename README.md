#  Build An Alexa High Low Game Skill with the Jargon SDK
<img src="https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/header._TTH_.png" />

This is a fork of the [Alexa High Low Game template skill](https://github.com/alexa/skill-sample-nodejs-highlowgame#readme) that uses the [Jargon SDK](https://www.npmjs.com/package/@jargon/alexa-skill-sdk/v/1.2.1) to manage content. This skill demonstrates the use of session and persistent attributes using Amazon DynamoDB and Amazon S3.

## Skill Architecture
Each skill consists of two basic parts, a front end and a back end.
The front end is the voice interface, or VUI.
The voice interface is configured through the voice interaction model.
The back end is where the logic of your skill resides.

> Note: The High Low Game uses persistent attributes.  When you create an Alexa-hosted skill, the persistence layer the sample code uses is Amazon S3.  No configuration or additional setup is required to use the S3 bucket provided with an Alexa-hosted skill.  When you create an AWS-hosted skill, the persistence layer the sample code uses is Amazon DynamoDB.  The tutorial will walk you through any additional steps required to setup and access DynamoDB.

## Instructions

### Installation
1. **Make sure** you are running the latest version of the CLI

   ```bash
   $ npm update -g ask-cli
   ```

2. If it's your first time using it, **initialize** the [ASK CLI](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html) by running `ask init`. Follow the prompts.

   ```bash
   $ ask init
   ```

3. Create a new skill from the template

   ``` bash
   $ ask new --url https://github.com/l-hartman/skill-sample-nodejs-highlowgame
   ```

### Deployment

ASK CLI **will create the skill and the lambda function for you**. The Lambda function will be created in ```us-east-1 (Northern Virginia)``` by default.

1. Navigate to the project's root directory. you should see a file named 'skill.json' there.

2. Deploy the skill and the lambda function in one step by running the following command:

   ```bash
   $ ask deploy
   ```

### Testing

1. To test, you need to login to Alexa Developer Console, and **enable the "Test" switch on your skill from the "Test" Tab**.

2. Simulate verbal interaction with your skill through the command line (this might take a few moments) using the following example (and be sure to use your invocation name if you've changed it):

   ```bash
   $ ask simulate -l en-US -t "start high low game"

   ✓ Simulation created for simulation id: 4a7a9ed8-94b2-40c0-b3bd-fb63d9887fa7
   ◡ Waiting for simulation response{
   "status": "SUCCESSFUL",
   ...
   ```

3. Once the "Test" switch is enabled, your skill can be tested on devices associated with the developer account as well. Speak to Alexa from any enabled device, from your browser at [echosim.io](https://echosim.io/welcome), or through your Amazon Mobile App and say:

   ```text
   Alexa, start high low game
   ```

### Customization

1. ```./skill.json```

   Change the skill name, example phrase, icons, testing instructions etc...

   Remember than many pieces of information are locale-specific and must be changed for each locale (e.g. en-US, en-GB, de-DE, etc.)

   See the Skill [Manifest Documentation](https://developer.amazon.com/docs/smapi/skill-manifest.html) for more information.

2. ```./lambda/custom/index.js```

   Change the core skill logic, and new intent handlers, etc.

3. ```./lambda/custom/resources/*```

   Customize the content your skill outputs to the user, including the trivia questions and answers.

4. ```./models/*.json```

   Change the model definition to replace the invocation name and the sample phrase for each intent. Repeat the operation for each locale you are planning to support.

5. Remember to re-deploy your skill and Lambda function for your changes to take effect.

   ```bash
   $ ask deploy
   ```


## Additional Resources

### Community
* [Amazon Developer Forums](https://forums.developer.amazon.com/spaces/165/index.html) - Join the conversation!
* [Hackster.io](https://www.hackster.io/amazon-alexa) - See what others are building with Alexa.

### Tutorials & Guides
* [Voice Design Guide](https://developer.amazon.com/designing-for-voice/) - A great resource for learning conversational and voice user interface design.
* [Codecademy: Learn Alexa](https://www.codecademy.com/learn/learn-alexa) - Learn how to build an Alexa Skill from within your browser with this beginner friendly tutorial on Codecademy!

### Documentation
* [Alexa Skills Kit SDK for Node.js](https://alexa.design/node-sdk-docs)
* [Alexa Skills Kit Documentation](https://developer.amazon.com/docs/ask-overviews/build-skills-with-the-alexa-skills-kit.html)
