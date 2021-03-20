require('dotenv').config();
const discord = require('discord.js');
const pupeteer = require('puppeteer');


let imgs = [];
const locations = ['ballston', 'fairfax', 'springfield', 'vienna', 'falls-church'] //@TODO static for now, more robust to scrape for

/**
 * Scrape to find all image urls that I can from Taco Bamba
 */
async function loadImgs(){
    locations.forEach(location => {
        pupeteer.launch({
            args: [ '--no-sandbox', '--disable-setuid-sandbox' ],
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
            console.log(grabImageUrls);
            imgs.push.apply(imgs, grabImageUrls["images"]);
            await browser.close();
        });
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
client.on('message', (msg) => {
    const content = msg.content.toLowerCase()
    if (content.includes('taco') && !msg.author.bot){
        const tacoIdx = content.indexOf("taco");
        console.log(tacoIdx);
        const searchString = msg.content.substr(tacoIdx, 4);
        const value = msg.content.replace(searchString, "__**" + searchString+ "**__")
        const idx = Math.floor(Math.random()*(imgs.length+1));
        if(imgs.length > 0) msg.reply(value+  "? Have you tried Taco Bamba Taqueria?", {files: [imgs[idx]]});
    }
});
