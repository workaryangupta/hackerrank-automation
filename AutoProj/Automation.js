
//node Automation.js --url=https://www.hackerrank.com --config=config.json

let minimist = require("minimist");
let fs = require("fs");
let puppeteer = require("puppeteer");

let args = minimist(process.argv);
let configJSON = fs.readFileSync(args.config, "utf-8");
let config = JSON.parse(configJSON);

async function run(){
    let browser = await puppeteer.launch({
        headless : false,
        args : [
            "--start-maximized"
        ],
        defaultViewport: {
            width: 1366,
            height : 768,
            isMobile: false      
        }
    });
    //launching browser
    let pages = await browser.pages();
    let page = pages[0];

    //go to the url
    await page.goto(args.url);
    
    //click on login on page 1 and wait
    await page.click("li#menu-item-2887");
    await page.waitForNavigation();

    //click on login on page 2 and wait
    await page.click("a.fl-button[href='https://www.hackerrank.com/login'");
    await page.waitForNavigation();

    //writing id and password
    await page.type("input[name='username'" , config.userid );
    await page.type("input[name='password'" , config.password );

    //click login on page 3 and wait
    await page.click("button[data-analytics='LoginPassword'");
    await page.waitForNavigation();

    //click on compete
    await page.click("a[data-analytics='NavBarContests'");
    //await page.waitForNavigation();  --> iski wajeh se aage ka code chal hi nahi rha tha

    //click on manage contests
    await page.waitForSelector("a[href='/administration/contests/'");
    await page.click("a[href='/administration/contests/'");

    //find number of pages                  
    await page.waitForSelector("a[data-attr1='Last'");
    let numPages = await page.$eval("a[data-attr1='Last'", function(atag){
        let totPages = parseInt(atag.getAttribute("data-page"));
        return totPages;
    })
    console.log(numPages);


    // do work for number of pages        
    for (let i = 1; i <= numPages; i++){
        await handleAllContestsOfPage(page, browser);

        if (i < numPages){
            await page.waitForSelector("a[data-attr1='Right'");
            await page.click("a[data-attr1='Right'");
        }
    }

async function handleAllContestsOfPage(page, browser){
    //find all urls of same page
    await page.waitForSelector("a.backbone.block-center");
    let curls = await page.$$eval("a.backbone.block-center", function(atags){
        let urls = [];

        for (let i = 0; i < atags.length; i++){

            let url = atags[i].getAttribute("href");
            urls.push(url);
        }
        return urls;
    })
    for (let i = 0; i < curls.length; i++){
        let curl = curls[i];

        let ctab = await browser.newPage();
 
        await saveModInContest(ctab, args.url + curl, config.moderator);
         
        await ctab.close();
        await page.waitForTimeout(1500);
    }
}    

async function saveModInContest(ctab, fullCurl, moderator){
    await ctab.bringToFront();
    await ctab.goto(fullCurl);

    await ctab.waitForTimeout(1500);
    
    //click on moderators tab
    await ctab.waitForSelector("li[data-tab='moderators'");
    await ctab.click("li[data-tab='moderators'", {delay: 2000});   //delay bcoz kuch time k baad load hota hai boxes ka text

    //writing name of moderator and press enter
    await ctab.waitForSelector("input#moderator");
    await ctab.type("input#moderator", moderator, {delay : 20});

    await ctab.keyboard.press("Enter", {delay: 1000});

}
}
run();