const puppeteer = require('puppeteer');
const fs        = require('fs');
const util      = require('util');
const url       = process.argv[2] || 'https://www.lib.umich.edu';
const config    = {
  standard: 'WCAG2AA',
  screenshot: 'page.png',
  datafile: 'page.json'
};

(async (url, config) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, {waitUntil: 'networkidle'});
  await page.screenshot({path: config.screenshot, fullPage: true});
  await page.addScriptTag({path: `${__dirname}/HTMLCS.js`});
  await page.addScriptTag({path: `${__dirname}/fullPath.js`});

  const analysis = await page.evaluate((config) => {
    window.HTMLCS.process(config.standard, window.document);
    return {
      documentTitle: window.document.title || '',
      pageUrl: window.location.href || '',
      issues: window.HTMLCS.getMessages().map((i) => {
        i.element = {
          path: fullPath(i.element),
          rectangle: i.element.getBoundingClientRect ? i.element.getBoundingClientRect() : {},
          html: i.element.outerHTML
        }
        return i;
      }) 
    };
  }, config);

  const elements = await page.evaluate(() => {
    var ret = []
    document.querySelectorAll('*').forEach(function(e) {
      ret.push({html: e.outerHTML, path: fullPath(e), rectangle: e.getBoundingClientRect()});
    });
    return ret;
  });

  fs.writeFile(config.datafile, JSON.stringify({analysis: analysis, elements: elements}));
  browser.close();
})(url, config);
