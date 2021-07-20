//  __   __  ___        ___
// |__) /  \  |  |__/ |  |  
// |__) \__/  |  |  \ |  |  

// This is the main file for the botNode bot.

// Import Botkit's core features
const { Botkit, BotkitConversation} = require('botkit');

const { BotkitCMSHelper } = require('botkit-plugin-cms');

// Import a platform-specific adapter for web.

const { WebAdapter } = require('botbuilder-adapter-web');

const { MongoDbStorage } = require('botbuilder-storage-mongodb');

// Load process.env values from .env file
require('dotenv').config();

let storage = null;
if (process.env.MONGO_URI) {
    storage = mongoStorage = new MongoDbStorage({
        url : process.env.MONGO_URI,
    });
}


const adapter = new WebAdapter({});


const controller = new Botkit({
    webhook_uri: '/api/messages',

    adapter: adapter,

    storage
});

if (process.env.CMS_URI) {
    controller.usePlugin(new BotkitCMSHelper({
        uri: process.env.CMS_URI,
        token: process.env.CMS_TOKEN,
    }));
}

// Once the bot has booted up its internal services, you can use them to do stuff.
controller.ready(() => {

    // load traditional developer-created local custom feature modules
    controller.loadModules(__dirname + '/features');

    /* catch-all that uses the CMS to trigger dialogs */
    if (controller.plugins.cms) {
        controller.on('message,direct_message', async (bot, message) => {
            let results = false;
            results = await controller.plugins.cms.testTrigger(bot, message);

            if (results !== false) {
                // do not continue middleware!
                return false;
            }
        });
    }

    const dinoNames = [
        'spinosaurus', 't-rex', 'dilophosaurus', 'velociraptor'
    ]

    function isInTheDocDino(dinoName){
        dinoName = '' + dinoName + '';
        return dinoNames.includes(dinoName.toLowerCase());
    }

    let convo = new BotkitConversation('dino', controller);

    convo.addQuestion('What is your favorite dino ?', async(response, convo, bot) => {
        const dinoName = response;
        convo.setVar('dinos', dinoName);

        if(isInTheDocDino(dinoName)){
            await convo.gotoThread('yes_dino');
        }
        else{
            await convo.gotoThread('no_dino');
        }
    }, 'dinoName','default');

    
    convo.addMessage('Sounds cool !', 'yes_dino');
    convo.addMessage('I don\'t know him', 'no_dino');
    
    convo.addQuestion('Is it a nice dino ?',  [

        {
            pattern: 'yes',
            handler: async(response, convo, bot) => {
                // if user says no, go back to favorite color.
                await convo.gotoThread('yes');
            }
        },
        {
            pattern: 'no',
            handler: async(response, convo, bot) => {
                // if user says no, go back to favorite color.
                await convo.gotoThread('nop');
            }
        },
        {
            default: true,
            handler: async(response, convo, bot) => {
                await convo.repeat();
            }
        }
    ], 'nice', 'yes_dino');

    convo.addMessage('Ok i want to be his friend !', 'yes');
    convo.addMessage('Ah maybe it\'s because he can eat you ...', 'nop');
    
    // add to the controller to make it available for later.
    controller.addDialog(convo);
    
    controller.hears(['rrrr','grr','shout'], 'message', async(bot, message) => {
        await bot.beginDialog('dino');
    });
      });







