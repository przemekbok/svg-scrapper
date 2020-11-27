const ppt = require('puppeteer');

/**
 * This is a module responsible for getting svg images from google search. Main goal is to return
 * links straight to resources. Module should dontain one public function for getting list of svg images links,
 * that maches given query string.
 *
 * TODO:
 * 1. Parallel search <done>
 * 2. Methods cleanup <done>
 */

async function initializeBrowserAndPage() {
  let browser = await ppt.launch({
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
    ],
  });
  let page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:75.0) Gecko/20100101 Firefox/75.0'
  );
  return { browser, page };
}

async function GoToGoogle(page) {
  await page.goto(`https://www.google.com/`);

  //submit to the terms of use
  await page.evaluate(() => {
    document
      .querySelector('iframe')
      .contentWindow.document.querySelector('#introAgreeButton')
      .click();
  });
}

async function PerformGoogleSearchForQuery(page, query) {
  await page.evaluate((query) => {
    document.querySelector('.gLFyf').value = `${query} svg`;
    document.querySelector('.gNO89b').click();
  }, query);
  await page.waitForNavigation();
}

async function SwitchToGoogleImageSeach(page) {
  await page.evaluate(() => {
    document.querySelector('.hdtb-imb > a').click();
  });
  await page.waitForNavigation({
    waitUntil: 'networkidle0',
  });
}

function LoadWholeGoogleImagePage(page) {
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
        resolve(await LoadWholeGoogleImagePage(page));
      }, 1000);
    } else {
      resolve();
    }
  });
}

async function LoadWholeYandexImagePage(page) {
  await page.evaluate(() => {
    window.scrollBy(0, document.body.scrollHeight);
  });
  return new Promise((resolve) => setTimeout(resolve, 5000));
}

async function GoToYandex(page) {
  await page.goto(`https://www.yandex.com/`);
}

async function PerformSearchForQuery(page, query) {
  await page.evaluate((query) => {
    document.querySelector('.input__control').value = `${query} svg`;
    document.querySelector('.button').click();
  }, query);
  await page.waitForNavigation();
}

async function SwitchToYandexImageSeach(page) {
  await page.evaluate(() => {
    window.location = document.querySelector(
      '.navigation__item_name_images > div > a'
    ).href;
  });
  await page.waitForNavigation({
    waitUntil: 'networkidle0',
  });
}

var SVGScrapperGoogleImage = () =>
  [...document.querySelectorAll('.VFACy')]
    .filter((a) => a.href.match(/^.+(\/.+)\.svg$/))
    .map((a) => a.href);

var SVGScrapperYandexImage = () =>
  [...document.querySelectorAll('.serp-item > div > a')]
    .map((a) => a.href.match(/(?<=&img_url=)(.*)(?=&)/g)[0])
    .map((url) => decodeURIComponent(url))
    .map((durl) => durl.match(/^[^&]*/g)[0])
    .filter((link) => /.*.svg$/g.test(link));

async function scrapSVGLinksFromWebpage(page, scrapperFunc) {
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

async function performSearch(browserPage, service, query, mode) {
  let scrapper;
  if (service === 'google') {
    await GoToGoogle(browserPage);
    await PerformGoogleSearchForQuery(browserPage, query);
    await SwitchToGoogleImageSeach(browserPage);
    if (mode === 'extensive') {
      await LoadWholeGoogleImagePage(browserPage);
    }
    scrapper = SVGScrapperGoogleImage;
  } else if (service === 'yandex') {
    await GoToYandex(browserPage);
    await PerformSearchForQuery(browserPage, query);
    await SwitchToYandexImageSeach(browserPage);
    if (mode === 'extensive') {
      await LoadWholeYandexImagePage(browserPage);
    }
    scrapper = SVGScrapperYandexImage;
  }

  let result = await scrapSVGLinksFromWebpage(browserPage, scrapper);
  return result;
}

async function ScrapFrom(service, query, mode) {
  return new Promise(async (resolve, reject) => {
    const { browser, page } = await initializeBrowserAndPage();
    let result = await performSearch(page, service, query, mode);
    await browser.close();
    resolve(result.data);
  }).catch(async (err) => {
    //log error
    await browser.close();
    return [];
  });
}

async function PerformScrapping(
  query,
  mode = 'quick',
  services = ['google', 'yandex']
) {
  let results = await Promise.all(
    services.map((service) => ScrapFrom(service, query, mode))
  ).catch((err) => PerformScrapping(query, services));
  results = [].concat(...results);
  return results;
}

PerformScrapping('react', 'extensive').then((result) => console.log(result));
