const puppeteer = require("puppeteer");
const url = "https://www.cinemaqualidade.is/";

const getMovies = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const response = await page.evaluate(() => {
    const movies = document.querySelectorAll(
      "#content_inside > .home_post_cont.post_box > a"
    );

    const list = Object.values(movies).map((v) => {
      return {
        link: v.href,
        title: v.querySelector(".in_title").outerText,
        img: v.querySelector("img").src,
      };
    });

    return list;
  });

  await page.close();

  const videosPromises = response.map(async ({ link, ...rest }, i) => {
    const newPage = await browser.newPage();

    await newPage.goto(link);

    await newPage.waitForSelector("a[service=BitTorrent]");

    const movie = await newPage.evaluate(async () => {
      const bitTorrent = document.querySelector("a[service=BitTorrent]").href;

      return bitTorrent;
    });

    await newPage.close();

    return {
      ...rest,
      movie,
    };
  });

  const resolveVideoPromises = await Promise.all(videosPromises).then((r) => r);

  const torrentPromises = resolveVideoPromises.map(
    async ({ movie, ...rest }) => {
      const newPage = await browser.newPage();

      await newPage.goto(movie);

      await newPage.waitForSelector("input");

      const torrent = await newPage.evaluate(async () => {
        const torrent = document.querySelector("input").value;

        return torrent;
      });

      await newPage.close();

      return {
        ...rest,
        torrent,
      };
    }
  );

  const resolveTorrentPromises = await Promise.all(torrentPromises).then(
    (r) => r
  );

  console.log(resolveTorrentPromises);

  await browser.close();
};

getMovies();
