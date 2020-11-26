const axios = require('axios');
const ppt = require('puppeteer');

/**
 * This is a module responsible for getting svg images from google search. Main goal is to return
 * links straight to resources. Module should dontain one public function for getting list of svg images links,
 * that maches given query string.
 *
 * TODO:
 * 1. Think about using typescript for that application.
 * 2. create a method that accepts string as param
 * 3. Go to google with puppeteer and search for given query
 * 4. Evaluate js query for tags with url
 * 5. Return all url as array
 * 5. Parse and decode urls in array
 * 6. Return arrays of parsed links
 * 7. Create function for browsing many pages with number of pages parameter
 */

var browser;
var page;

async function initializeBrowserAndPage() {
  browser = await ppt.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
    ],
  });
  page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0'
  );
}

async function goToWebpageAndSearchForQuery(query, gotoFunc) {
  if (goToWebpageAndSearchForQuery.numberOfRedirectsOnPage === undefined) {
    goToWebpageAndSearchForQuery.websitesTurnedOnPageCounter = 0;
  } else {
    await page.waitForNavigation();
  }
  return await gotoFunc(query);
}

async function GoToGoogle() {
  await page.goto(`https://www.google.com/`);

  //submit to the terms of use
  await page.evaluate(() => {
    document
      .querySelector('iframe')
      .contentWindow.document.querySelector('#introAgreeButton')
      .click();
  });
}

async function PerformGoogleSearchForQuery(query) {
  await page.evaluate((query) => {
    document.querySelector('.gLFyf').value = `${query} svg`;
    document.querySelector('.gNO89b').click();
  }, query);
  await page.waitForNavigation();
}

async function SwitchToGoogleImageSeach() {
  await page.evaluate(() => {
    document.querySelector('.hdtb-imb > a').click();
  });
  await page.waitForNavigation({
    waitUntil: 'networkidle0',
  });
}

function LoadWholeGoogleImagePage() {
  if (this.prevBodyHeight === undefined) {
    this.prevBodyHeight = 0;
  }
  if (this.counter === undefined) {
    this.counter = 0;
  }
  return new Promise(async (resolve, reject) => {
    let bodyHeight = await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      if (document.querySelector('.YstHxe').style.display !== 'none') {
        document.querySelector('.YstHxe > input').click();
      }
      return document.body.scrollHeight;
    });
    if (bodyHeight === this.prevBodyHeight) {
      this.counter++;
    } else {
      this.counter = 0;
    }
    if (counter < 4) {
      setTimeout(async () => {
        this.prevBodyHeight = bodyHeight;
        resolve(await LoadWholeGoogleImagePage());
      }, 1000);
    } else {
      resolve();
    }
  });
}

async function goToYandexAndSearchForQuery(query) {
  //go to yandex
  await page.goto(`https://www.yandex.com/`);

  //insert query into search bar and submit
  await page.evaluate((query) => {
    document.querySelector('.input__control').value = `${query} svg`;
    document.querySelector('.button').click();
  }, query);
  await page.waitForNavigation();
  await page.evaluate(() => {
    window.location = document.querySelector(
      '.navigation__item_name_images > div > a'
    ).href;
  });
  await page.waitForNavigation();
}

var scrapperGoogleImage = () =>
  [...document.querySelectorAll('.VFACy')]
    .filter((a) => a.href.match(/^.+(\/.+)\.svg$/))
    .map((a) => a.href);

var scrapperYandexImage = () =>
  [...document.querySelectorAll('.serp-item > div > a')]
    .map((a) => a.href.match(/(?<=&img_url=)(.*)(?=&)/g)[0])
    .map((url) => decodeURIComponent(url))
    .map((durl) => durl.match(/^[^&]*/g)[0])
    .filter((link) => /.*.svg$/g.test(link));

async function scrapSVGLinksFromWebpage(scrapperFunc) {
  let result = await page.evaluate((scrapperFunc) => {
    return eval(scrapperFunc)();
  }, scrapperFunc.toString());
  if (result.length === 0) {
    return {
      type: 'Error',
      message: 'There is no svg images for this query',
      data: undefined,
    };
  } else {
    return { type: 'Success', message: undefined, data: result };
  }
}

async function performGoogleSearch(query, mode) {
  await goToWebpageAndSearchForQuery(query, async (query) => {
    await GoToGoogle();
    await PerformGoogleSearchForQuery(query);
    await SwitchToGoogleImageSeach();
    if (mode === 'extensive') {
      await LoadWholeGoogleImagePage();
    }
  });
  let result = await scrapSVGLinksFromWebpage(scrapperGoogleImage);
  return result;
}

async function performYandexSearch(query, mode) {
  await goToWebpageAndSearchForQuery(query, goToYandexAndSearchForQuery);
  let result = await scrapSVGLinksFromWebpage(scrapperYandexImage);
  return result;
}

async function PerformScrapping(
  query,
  mode = 'quick',
  services = ['google', 'yandex']
) {
  await initializeBrowserAndPage();
  let results = [];
  try {
    if (services.indexOf('google') !== -1) {
      let result = await performGoogleSearch(query, mode).catch((error) => {
        //log error
        console.log(error);
      });
      results = [...results, ...result.data];
    }
    if (services.indexOf('yandex') !== -1) {
      let result = await performYandexSearch(query, mode).catch((error) => {
        //log error
        console.log(error);
      });
      results = [...results, ...result.data];
    }
  } catch (err) {
    results = PerformScrapping(query, services);
  }
  await browser.close();
  return results;
}

PerformScrapping('react', 'extensive').then((result) => console.log(result));
