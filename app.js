require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const discord = require('discord.js');

const express = require('express');

const app = express();

app.listen(process.env.PORT || 3000, function(){ //bind to port
    console.log("started server successfully");
});


const baseUrl = 'https://www.tacobamba.com';
let imgs = [];
let menu = new Set();

let aboutVictor = '! Are you talking about our Chef and Owner, Victor Albisu?';
let victorImg = '';


/**
 * More lightweight than puppeteer for web scraping Taco Bamba
 * @returns {Promise<void>}
 */
async function loadImages() {
    const htmlData = (await axios.get(baseUrl + "/gallery/")).data;
    const $ = await cheerio.load(htmlData);
    const locations = $('.card__btn'); //search for locations
    const locs = []
    await locations.each((i, e) => {
        locs[i] = $(e).attr('href');
    });
    for (const loc of locs) {
        const data = await axios.get(baseUrl + loc);
        const $ = cheerio.load(data.data);
        const locations = $('.card__btn');
        await locations.each((i, e) => {
            let img = $(e).attr('href');
            img = img.substr(0, img.indexOf('.jpg') + 4,);
            imgs.push(img);
        });
    }
}

/**
 * Iteration on Loading the Menu of Taco Bamba
 * @returns {Promise<void>}
 */
async function loadMenu() {
    const htmlData = await axios.get(baseUrl + "/menus/");
    const $ = await cheerio.load(htmlData.data);
    const items = $('.menu-item__heading');
    await items.each((i, e) => {
        let menuItem = $(e).text();
        menuItem = menuItem.split("(")[0];
        menuItem = menuItem.replace(/(\w)(\w*)/g,
            function (g0, g1, g2) {
                return g1.toUpperCase() + g2.toLowerCase();
            });
        menu.add(menuItem);
    });
    menu = Array.from(menu);
}

/**
 * Load the about page for Victor Albisu
 * @returns {Promise<void>}
 */
async function loadAbout() {
    const htmlData = await axios.get(baseUrl + "/team-member/victor-albisu");
    const $ = await cheerio.load(htmlData.data);
    const aboutMe = $('.content');
    await aboutMe.each((i, e) => {
        let values = $(e).find("p");
        $(e).find("img").each((j, a) => {
            victorImg = $(a).attr("src").toString();
            victorImg = victorImg.substr(0, victorImg.indexOf('.png') + 4)
        });
        values.each((j, a) => {
            const paragraph = $(a).text();
            if (paragraph.length > 20) {
                aboutVictor = aboutVictor + "\n\n" + paragraph;
            }
        });
    });
}

/**
 *
 * Set discord status to be some menu item from taco bamba
 * @param client
 * @returns {Promise<Presence>}
 */
function setStatus(client) {
    const menuIdx = Math.floor(Math.random() * menu.length);
    return client.user.setActivity("customers enjoy their " + menu[menuIdx], {type: "WATCHING"});
}

function byKeyword(content, searchTerm){
    const lower = content.toLowerCase();
    const idx = lower.indexOf(searchTerm);
    if(idx == -1) return null;

}


const client = new discord.Client();
client.login(process.env.BOT_TOKEN);

loadImages().then(() => loadMenu().then(()=> loadAbout().then(() => {
    setStatus(client);
    setInterval(() => {
        setStatus(client);
    }, 300000);
    client.on('message', (msg) => {
        const content = msg.content.toLowerCase()
        if (content.includes('taco') && !msg.author.bot) {
            console.log(content);
            const tacoIdx = content.indexOf("taco");
            const searchString = msg.content.substr(tacoIdx, 4);
            const value = msg.content.replace(searchString, "__**" + searchString + "**__")
            const idx = Math.floor(Math.random() * (imgs.length));
            if (imgs.length > 0) msg.reply(value + "? Have you tried Taco Bamba Taqueria?", {files: [imgs[idx]]});
        } else if (content.includes('victor') && !msg.author.bot) {
            console.log(content);
            const victorIdx = content.indexOf("victor");
            const searchString = msg.content.substr(victorIdx, "victor".length);
            let value = msg.content.replace(searchString, "__**" + searchString + "**__")+aboutVictor;
            value = value.substr(0, 1950) + "...";
            if(victorImg.length > 0) msg.reply(value, {files: [victorImg]});
        }
    });
})));


