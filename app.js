require('dotenv').config();
const discord = require('discord.js');
const pupeteer = require('puppeteer');


let imgs = [];
const locations = ['ballston', 'fairfax', 'springfield', 'vienna', 'falls-church'] //@TODO static for now, more robust to scrape for

/**
 * Scrape to find all image urls that I can from Taco Bamba
 */
locations.forEach(location => {
    pupeteer.launch().then(async browser => {
        const page = await browser.newPage();
        await page.goto('https://www.tacobamba.com/gallery/' + location);
        await page.waitForSelector('body');
        let grabImageUrls = await page.evaluate(() => {
            let allImages = document.body.getElementsByClassName('card__btn');
            console.log(allImages);
            let scrape = [];
            for (let key in allImages) {
                let image = allImages[key].href;
                if (image) scrape.push(image.substr(0, image.indexOf('.jpg') + 4,));
            }
            /*allImages.forEach(image =>{
               let url = image.style;
               console.log(url);
               scape.push(url);
            });*/
            return {"images": scrape};
        });
        //console.log(grabImageUrls);
        imgs.push.apply(imgs, grabImageUrls["images"]);
        await browser.close();
    });
});


const client = new discord.Client();
client.login(process.env.BOT_TOKEN);
client.on('message', (msg) => {
    if (msg.content.toLowerCase().includes('taco')){
        const idx = Math.floor(Math.random()*(imgs.length+1));
        msg.reply("I see you are interested in some Tacos, have you tried Taco Bamba Taqueria!", {files: [imgs[idx]]});
    }
});
