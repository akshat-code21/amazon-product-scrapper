import puppeteer from "puppeteer";
import getHighResImageUrl from "utils/thumbnailUrl";
export default async function scrapeData(productLink : string){
    try {
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
        const featureUl = "#feature-bullets > ul"
        const tableSelector = "#productDetails_techSpec_section_1"
        const thumbnailsSelector = "#altImages .item"; 
        const summarySelector = "#product-summary > p.a-spacing-small > span";
        await page.waitForSelector(titleSelector);
        await page.waitForSelector(ratingSelector)
        await page.waitForSelector(ratingParentSelector)
        await page.waitForSelector(sellingPriceSelector)
        await page.waitForSelector(totalDiscountSelector)
        await page.waitForSelector(featureUl)
        await page.waitForSelector(tableSelector)
        await page.waitForSelector(thumbnailsSelector);
        await page.waitForSelector(summarySelector);
        const title = await page.$eval(titleSelector, (element) => element.textContent?.trim());
        const rating = await page.$eval(ratingSelector,(element)=>element.previousElementSibling.textContent?.trim())
        const numberOfRatings = await page.$eval(ratingParentSelector,(ele)=>ele.children[2].innerText.split(' ')[0])
        const sellingPrice = await page.$eval(sellingPriceSelector,(element)=>element.textContent?.trim())
        const totalDiscount = await page.$eval(totalDiscountSelector,(element)=>element.textContent?.trim())
        const LiS = await page.$eval(featureUl, (element) => {
            const listItems = element.querySelectorAll('li');
            return Array.from(listItems).map((li:any) => li.textContent?.trim()).filter(Boolean);
        });
        const techDetails = await page.$eval(tableSelector, (element) => {
            const rows = element.querySelectorAll('tr');
            const specs = {};
            
            rows.forEach((row:any) => {
                const [label, value] = Array.from(row.children).map((cell:any) => 
                    cell.textContent.trim().replace(/\s+/g, ' ')
                );
                
                if (label && value) {
                    // Remove any special characters from label
                    const cleanLabel = label.replace(/[^a-zA-Z0-9\s]/g, '').trim();
                    // @ts-ignore
                    specs[cleanLabel] = value;
                }
            });
            
            return specs;
        });
        const thumbnailUrls = await page.$$eval(thumbnailsSelector, (thumbnails) => {
            return thumbnails.map(thumb => {
                const img = thumb.querySelector('img');
                return img ? img.getAttribute('src') : null;
            }).filter(url => url !== null);
        });
        const summaryReview = await page.$eval(summarySelector,(element)=>element.textContent.trim());
        console.log('Title:', title);
        console.log('rating:', rating);
        console.log('numberOfRatings:', numberOfRatings);
        console.log('sellingPrice:₹', sellingPrice);
        console.log('totalDiscount: ', totalDiscount);
        console.log('Features:', LiS);
        console.log('Technical Details:', JSON.stringify(techDetails, null, 2));
        console.log('Thumbnail Images:', thumbnailUrls);
        console.log('summaryReview:', summaryReview);
    } catch (error) {
        console.error(error);
    }
}