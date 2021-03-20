require('dotenv').config();
const discord = require('discord.js');
const pupeteer = require('puppeteer');


let imgs = [];
let menuItems = [];

//@TODO should probably make this a web app w/ Kaffine to give a bedtime to the app
const locations = ['ballston', 'fairfax', 'springfield', 'vienna', 'falls-church'] //@TODO static for now, more robust to scrape for

/**
 * Scrape to find all image urls that I can from Taco Bamba
 */
async function loadImgs() {
    locations.forEach(async location => {
        await pupeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true
        }).then(async browser => {
            const page = await browser.newPage();
            await page.goto('https://www.tacobamba.com/gallery/' + location);
            await page.waitForSelector('body');
            let grabImageUrls = await page.evaluate(() => {
                let allImages = document.body.getElementsByClassName('card__btn');
                let scrape = [];
                for (let key in allImages) {
                    let image = allImages[key].href;
                    if (image) scrape.push(image.substr(0, image.indexOf('.jpg') + 4,));
                }
                return {"images": scrape};
            });
            imgs.push.apply(imgs, grabImageUrls["images"]);
            await browser.close();
        });
    });
}

async function loadMenu() {
    return await pupeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    }).then(async browser => {
        const page = await browser.newPage();
        await page.goto('https://www.tacobamba.com/menus/');
        await page.waitForSelector('body');
        let grabMenu = await page.evaluate(() => {
            let allItems = document.body.getElementsByClassName('h3 menu-item__heading');
            let scrape = [];
            for (let key in allItems) {
                let menuItem = allItems[key].innerText;
                if (menuItem) {
                    menuItem = menuItem.split("(")[0];
                    menuItem = menuItem.replace(/(\w)(\w*)/g,
                        function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();});

                    scrape.push(menuItem);
                }
            }
            return {"menu": scrape};
        });
        menuItems.push.apply(menuItems, grabMenu["menu"]);
        await browser.close();
    });
}

loadImgs();


/**
 *
 * Discord launch connect and launch discord app
 * @type {module:"discord.js".Client}
 */
const client = new discord.Client();
client.login(process.env.BOT_TOKEN);

loadMenu().then(() => {
    setInterval(()=>{
        const idx = Math.floor(Math.random() * (menuItems.length + 1));
        client.user.setActivity("customers enjoy a " + menuItems[idx], {type: "WATCHING"})
    }, 300000);
;
});
client.on('message', (msg) => {
    const content = msg.content.toLowerCase()
    if (content.includes('taco') && !msg.author.bot) {
        const tacoIdx = content.indexOf("taco");
        console.log(tacoIdx);
        const searchString = msg.content.substr(tacoIdx, 4);
        const value = msg.content.replace(searchString, "__**" + searchString + "**__")
        const idx = Math.floor(Math.random() * (imgs.length + 1));
        if (imgs.length > 0) msg.reply(value + "? Have you tried Taco Bamba Taqueria?", {files: [imgs[idx]]});
    }
});
