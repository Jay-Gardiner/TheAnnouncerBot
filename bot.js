const Discord = require('discord.js');
const auth = require('./auth.json');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const url = 'https://www.epicgames.com/store/en-US/';
const annoucementsChannelID = '560827679360679946';
const botChannelID = '687095097921372220';

// Create a new instance of a Discord client
const client = new Discord.Client();

client.on('ready', () => {
    console.log("I am ready!");
})

client.on('message', message => {
    // The bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.content.substring(0, 1) == '!') {
        var args = message.content.substring(1).split(' ');
        var cmd = args[0];
   
        args = args.splice(1);
        switch(cmd) {
        // Manual way to start the bot
            case 'runtheannouncerbot':
                ScrapeEpicGames();
		        setInterval(ScrapeEpicGames, 604800000);
            break;
        }
    }
});

client.login(auth.token);

// Function scrapes games from epicgames.com and dumps into an array
function ScrapeEpicGames() {
    var gamesList = [];

    (() => {
        puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']}).then(browser => {
            browser.newPage().then(page => {
                return page.goto(url, {waitUntil: 'networkidle2'}).then(() => {
                    return page.content();
                })
            })
            .then(html => {
                const $ = cheerio.load(html);

                const cards = $('section[class="CardGrid-groupWrapper_e669488f"] > .CardGrid-group_c5363b6a > div').each(function() {
                    gamesList.push({
                        title: $(this).find('.OfferTitleInfo-title_ed062ba4').text(),
                        dates: $(this).find('.OfferTitleInfo-subtitle_30c79f0d > span').text(),
                    });
                });
                browser.close()
                PostFreeGames(gamesList);
            });
        })
    })()
}

function PostFreeGames(gamesList) {
    var freeGames = [];
    var messageText = "";

    // Sorts through list of games and grabs anything with a 'free' in the subtitle
    for (var i = 0; i < gamesList.length; i++) {
        if(gamesList[i].dates.includes('Free')) {
            freeGames[i] = gamesList[i];
            messageText = messageText.concat("**" + freeGames[i].title + "**" + " - " + freeGames[i].dates + "\n");
        }
    }

    console.log(gamesList);
    console.log(messageText);

    var newMessage = "▂▂▂▃▅▇█▓▒░█▒▒▒▒▒▒▒█☆@everyone☆█▒▒▒▒▒▒▒█░▒▓█▇▅▃▂▂▂" + "\n" + "･ ｡ﾟ☆: .☽ . :☆ﾟ. ───(ᵔᴥᵔ) | ❀ Public Service Announcement ❀ | (ᵔᴥᵔ)─── ･ ｡ﾟ☆: .☽ . :☆ﾟ\n                                      ❀ | Epic games have a free rotating game roster | ❀\n                           ❀ | This weeks current and upcoming games are listed below | ❀\n" + "===============================================================\n\n" + messageText + "\n";

    client.channels.cache.get(annoucementsChannelID).send(newMessage);
}