// Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// Licensed under the Amazon Software License
// http://aws.amazon.com/asl/

/* eslint-disable  func-names */
/* eslint-disable  no-console */
/* eslint-disable  no-restricted-syntax */

const Alexa = require('ask-sdk');
const Jargon = require('@jargon/alexa-skill-sdk');
const ri = Jargon.ri;
const ddbAdapter = require('ask-sdk-dynamodb-persistence-adapter'); // included in ask-sdk

// TODO: The items below this comment need your attention.
const SKILL_NAME = 'High Low Game';
const ddbTableName = 'High-Low-Game';

const inGameFallback = ri('FALLBACK_MESSAGE_DURING_GAME', { skillName: SKILL_NAME });
const inGameFallbackRepromt = ri('FALLBACK_REPROMPT_DURING_GAME');
const outGameFallback = ri('FALLBACK_MESSAGE_OUTSIDE_GAME', { skillName: SKILL_NAME });
const outGameFallbackReprompt = ri('FALLBACK_REPROMPT_OUTSIDE_GAME');

const LaunchRequest = {
  canHandle(handlerInput) {
    // launch requests as well as any new session, as games are not saved in progress, which makes
    // no one shots a reasonable idea except for help, and the welcome message provides some help.
    return handlerInput.requestEnvelope.session.new || handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;

    const attributes = await attributesManager.getPersistentAttributes() || {};
    if (Object.keys(attributes).length === 0) {
      attributes.endedSessionCount = 0;
      attributes.gamesPlayed = 0;
      attributes.gameState = 'ENDED';
    }

    attributesManager.setSessionAttributes(attributes);

    const welcomeSpeech = ri('WELCOME.default', { gamesPlayed: attributes.gamesPlayed.toString() });
    const welcomeReprompt = ri('WELCOME.reprompt');

    return handlerInput.jrb
      .speak(welcomeSpeech)
      .reprompt(welcomeReprompt)
      .getResponse();
  },
};

const ExitHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest'
      && (request.intent.name === 'AMAZON.CancelIntent'
        || request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.jrb
      .speak(ri('GOODBYE.v1'))
      .getResponse();
  },
};

const SessionEndedRequest = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);
    return handlerInput.responseBuilder.getResponse();
  },
};

const HelpIntent = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;

    return request.type === 'IntentRequest' && request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const helpSpeechOutput = ri("HELP.default");
    const helpReprompt = ri("HELP.reprompt");

    return handlerInput.jrb
      .speak(helpSpeechOutput)
      .reprompt(helpReprompt)
      .getResponse();
  },
};

const YesIntent = {
  canHandle(handlerInput) {
    // only start a new game if yes is said when not playing a game.
    let isCurrentlyPlaying = false;
    const request = handlerInput.requestEnvelope.request;
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.gameState &&
      sessionAttributes.gameState === 'STARTED') {
      isCurrentlyPlaying = true;
    }

    return !isCurrentlyPlaying && request.type === 'IntentRequest' && request.intent.name === 'AMAZON.YesIntent';
  },
  handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    sessionAttributes.gameState = 'STARTED';
    sessionAttributes.guessNumber = Math.floor(Math.random() * 101);

    const startGameSpeech = ri("START.default");
    const startGameReprompt = ri("START.reprompt");

    return handlerInput.jrb
      .speak(startGameSpeech)
      .reprompt(startGameReprompt)
      .getResponse();
  },
};

const NoIntent = {
  canHandle(handlerInput) {
    // only treat no as an exit when outside a game
    let isCurrentlyPlaying = false;
    const request = handlerInput.requestEnvelope.request;
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.gameState &&
      sessionAttributes.gameState === 'STARTED') {
      isCurrentlyPlaying = true;
    }

    return !isCurrentlyPlaying && request.type === 'IntentRequest' && request.intent.name === 'AMAZON.NoIntent';
  },
  async handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    sessionAttributes.endedSessionCount += 1;
    sessionAttributes.gameState = 'ENDED';
    attributesManager.setPersistentAttributes(sessionAttributes);

    await attributesManager.savePersistentAttributes();

    return handlerInput.jrb.speak(ri('GOODBYE.v2')).getResponse();
  },
};

const UnhandledIntent = {
  canHandle() {
    return true;
  },
  handle(handlerInput) {
    const unhandledSpeech = ri('UNHANDLED');
    return handlerInput.jrb
      .speak(unhandledSpeech)
      .reprompt(unhandledSpeech)
      .getResponse();
  },
};

const NumberGuessIntent = {
  canHandle(handlerInput) {
    // handle numbers only during a game
    let isCurrentlyPlaying = false;
    const request = handlerInput.requestEnvelope.request;
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.gameState &&
      sessionAttributes.gameState === 'STARTED') {
      isCurrentlyPlaying = true;
    }

    return isCurrentlyPlaying && request.type === 'IntentRequest' && request.intent.name === 'NumberGuessIntent';
  },
  async handle(handlerInput) {
    const { requestEnvelope, attributesManager, jrb } = handlerInput;

    const guessNum = parseInt(requestEnvelope.request.intent.slots.number.value, 10);
    const sessionAttributes = attributesManager.getSessionAttributes();
    const targetNum = sessionAttributes.guessNumber;

    if (guessNum > targetNum) {
      const highSpeech = ri('GUESS_RESPONSE.high.default', { guess: guessNum.toString() });
      const highReprompt = ri('GUESS_RESPONSE.high.reprompt');

      return jrb
        .speak(highSpeech)
        .reprompt(highReprompt)
        .getResponse();
    } else if (guessNum < targetNum) {
      const lowSpeech = ri('GUESS_RESPONSE.low.default', { guess: guessNum.toString() });
      const lowReprompt = ri('GUESS_RESPONSE.low.reprompt');

      return jrb
        .speak(lowSpeech)
        .reprompt(lowReprompt)
        .getResponse();
    } else if (guessNum === targetNum) {
      sessionAttributes.gamesPlayed += 1;
      sessionAttributes.gameState = 'ENDED';
      attributesManager.setPersistentAttributes(sessionAttributes);
      await attributesManager.savePersistentAttributes();

      const correctSpeach = ri('GUESS_RESPONSE.equal.default', { guess: guessNum.toString() });
      const correctReprompt = ri('GUESS_RESPONSE.equal.reprompt');

      return jrb
        .speak(correctSpeach)
        .reprompt(correctReprompt)
        .getResponse();
    }
    return jrb
      .speak(ri('badInput.default'))
      .reprompt(ri('badInput.repromt'))
      .getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    const errorSpeech = ri('ERROR');

    return handlerInput.jrb
      .speak(errorSpeech)
      .reprompt(errorSpeech)
      .getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    // handle fallback intent, yes and no when playing a game
    // for yes and no, will only get here if and not caught by the normal intent handler
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest' &&
      (request.intent.name === 'AMAZON.FallbackIntent' ||
        request.intent.name === 'AMAZON.YesIntent' ||
        request.intent.name === 'AMAZON.NoIntent');
  },
  handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.gameState &&
      sessionAttributes.gameState === 'STARTED') {
      // currently playing
      return handlerInput.jrb
        .speak(inGameFallback)
        .reprompt(inGameFallbackRepromt)
        .getResponse();
    }

    // not playing
    return handlerInput.jrb
      .speak(outGameFallback)
      .reprompt(outGameFallbackReprompt)
      .getResponse();
  },
};

function getPersistenceAdapter(tableName) {
  // Determines persistence adapter to be used based on environment
  // Note: tableName is only used for DynamoDB Persistence Adapter
  if (process.env.S3_PERSISTENCE_BUCKET) {
    // in Alexa Hosted Environment
    // eslint-disable-next-line global-require
    const s3Adapter = require('ask-sdk-s3-persistence-adapter');
    return new s3Adapter.S3PersistenceAdapter({
      bucketName: process.env.S3_PERSISTENCE_BUCKET,
    });
  }

  // Not in Alexa Hosted Environment
  return new ddbAdapter.DynamoDbPersistenceAdapter({
    tableName: tableName,
    createTable: true,
  });
}

const skillBuilder = new Jargon.JargonSkillBuilder().wrap(Alexa.SkillBuilders.custom());

exports.handler = skillBuilder
  .withPersistenceAdapter(getPersistenceAdapter(ddbTableName))
  .addRequestHandlers(
    LaunchRequest,
    ExitHandler,
    SessionEndedRequest,
    HelpIntent,
    YesIntent,
    NoIntent,
    NumberGuessIntent,
    FallbackHandler,
    UnhandledIntent,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
