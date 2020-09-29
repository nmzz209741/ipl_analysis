const puppeteer = require('puppeteer');
const fs = require('fs');


const web_url = 'https://www.iplt20.com/points-table/2020';

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false
    });

    const page = await browser.newPage();
    await page.goto(web_url);

    let years = await page.evaluate(() => {
      let urlList = []
      let dropdownOptions = document.querySelectorAll('a.drop-down__link')
      console.info(dropdownOptions);
      for (let i = 0; i < dropdownOptions.length; i++) {
        urlList[i] = {
          year: dropdownOptions[i].innerHTML.trim(),
          link: dropdownOptions[i].href
        }
      }
      return urlList
    });

    for (let i = 0; i < years.length; i++) {
      await page.goto(years[i].link);

      let scores = await page.evaluate(() => {
        let headerList = document.querySelectorAll(`th`)
        let bodyList = document.getElementsByTagName('td')

        let scoresListArray = []
        const numberOfTeams = bodyList.length / headerList.length
        for (let i = 0; i < numberOfTeams; i++) {
          let teamDetails = {
            title: bodyList[i * headerList.length + 1].innerText,
            teamName: bodyList[i * headerList.length + 1].innerHTML.match('<span class="standings-table__team-name js-team">(.*?)<\/span>')[1],
            played: bodyList[i * headerList.length + 2].innerText,
            won: bodyList[i * headerList.length + 3].innerText,
            lost: bodyList[i * headerList.length + 4].innerText,
            tied: bodyList[i * headerList.length + 5].innerText,
            n_r: bodyList[i * headerList.length + 6].innerText,
            net_rr: bodyList[i * headerList.length + 7].innerText,
            for: bodyList[i * headerList.length + 8].innerText,
            against: bodyList[i * headerList.length + 9].innerText,
            points: bodyList[i * headerList.length + 10].innerText,
          }
          scoresListArray[i] = teamDetails
        }
        return scoresListArray;
      })

      fs.writeFile(`data/scores_${years[i].year}.json`, JSON.stringify(scores), function (err) {
        if (err) throw err;
        console.log(`Saved!! scores_${years[i].year}.json`)
      })
    }
    console.log('Browser closed');
    await browser.close();
  } catch (err) {
    console.log(err);
    await browser.close();
    console.log('Browser has been closed');
  }
})();