import puppeteer from "puppeteer";
export default async function scrapeData(productLink : string){
    const browser = await puppeteer.launch({
        headless : false
    });
    const page = await browser.newPage();
    await page.setViewport({width: 1080, height: 1024});
    await page.goto(productLink);
    const titleSelector = "h1#title"
    const ratingSelector = "i.a-icon.a-icon-star.a-star-4.cm-cr-review-stars-spacing-big"
    const ratingParentSelector = "#averageCustomerReviews"
    const sellingPriceSelector = "span.a-price-whole"
    const totalDiscountSelector = "span.savingsPercentage"
    await page.waitForSelector(titleSelector);
    await page.waitForSelector(ratingSelector)
    await page.waitForSelector(ratingParentSelector)
    await page.waitForSelector(sellingPriceSelector)
    await page.waitForSelector(totalDiscountSelector)
    const title = await page.$eval(titleSelector, (element) => element.textContent?.trim());
    const rating = await page.$eval(ratingSelector,(element)=>element.previousElementSibling.textContent?.trim())
    const numberOfRatings = await page.$eval(ratingParentSelector,(ele)=>ele.children[2].innerText.split(' ')[0])
    const sellingPrice = await page.$eval(sellingPriceSelector,(element)=>element.textContent?.trim())
    const totalDiscount = await page.$eval(totalDiscountSelector,(element)=>element.textContent?.trim())
    console.log('Title:', title);
    console.log('rating:', rating);
    console.log('numberOfRatings:', numberOfRatings);
    console.log('sellingPrice:₹', sellingPrice);
    console.log('totalDiscount: ', totalDiscount);
}