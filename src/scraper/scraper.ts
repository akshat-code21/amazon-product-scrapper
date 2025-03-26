import puppeteer from "puppeteer";

function cleanText(text: string | undefined | null): string {
    if (!text) return '';   
    return text.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '').trim();
}

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
        const manufacturerImagesSelector = "#aplus img, .apm-flex img, .apm-flex-item-third-width img, .apm-text-center img, .a-spacing-mini img";
        const summarySelector = "#product-summary > p.a-spacing-small > span";
        const bankOffersButtonSelector = ".a-size-base.a-spacing-micro.offers-items-title";
        const allOffersLinkSelector = "a:contains('45 offers')";
        await page.waitForSelector(titleSelector);
        await page.waitForSelector(ratingSelector)
        await page.waitForSelector(ratingParentSelector)
        await page.waitForSelector(sellingPriceSelector)
        await page.waitForSelector(totalDiscountSelector)
        await page.waitForSelector(featureUl)
        await page.waitForSelector(tableSelector)
        await page.waitForSelector(thumbnailsSelector);
        await page.waitForSelector(manufacturerImagesSelector);
        await page.waitForSelector(summarySelector);
        const title = cleanText(await page.$eval(titleSelector, (element) => element.textContent?.trim()));
        const rating = cleanText(await page.$eval(ratingSelector,(element)=>element.previousElementSibling.textContent?.trim()))
        const numberOfRatings = cleanText(await page.$eval(ratingParentSelector,(ele)=>ele.children[2].innerText.split(' ')[0]))
        const sellingPrice = cleanText(await page.$eval(sellingPriceSelector,(element)=>element.textContent?.trim()))
        const totalDiscount = cleanText(await page.$eval(totalDiscountSelector,(element)=>element.textContent?.trim()))
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
                    // Clean the label and value
                    const cleanLabel = label.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
                    const cleanValue = value.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
                    specs[cleanLabel] = cleanValue;
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

        const highResImageUrls = thumbnailUrls.map(url => {
            if (url) {
                return url.replace(/\._[^\.]+_\./, '.'); 
            }
            return null;
        }).filter(Boolean);

        const summaryReview = cleanText(await page.$eval(summarySelector,(element)=>element.textContent.trim()));
        const manufacturerImages = await page.$$eval(manufacturerImagesSelector, (images) => {
            return images.map(img => {
                let src = img.getAttribute('data-src') || img.getAttribute('src');                
                if (src && 
                    !src.includes('sprite') && 
                    !src.includes('icon') && 
                    !src.includes('grey-pixel.gif') && 
                    !src.includes('amazon-avatars-global') && 
                    !src.includes('default.png')) {
                    if (src.includes('amazon.com/images')) {
                        src = src.replace(/\._[^\.]+_\./, '.');
                    }
                    return src;
                }
                return null;
            }).filter(url => url !== null);
        });
        let bankOffers:any = [];
        try {
            const bankOffersExists = await page.$(bankOffersButtonSelector);
            if (bankOffersExists) {
                const allOffersLink = await page.$('#itembox-InstantBankDiscount > span > a');
                if (allOffersLink) {
                    await allOffersLink.click();
                    await page.waitForSelector('.vsx-offers-desktop-lv__list', { timeout: 5000 });
                    bankOffers = await page.$$eval('.vsx-offers-desktop-lv__item', (offerItems) => {
                        return offerItems.map(item => {
                            const offerNumberElement = item.querySelector('.a-text-bold');
                            const offerNumber = offerNumberElement?.textContent?.trim() || '';
                            let fullText = item.textContent?.trim().replace(/\s+/g, ' ') || '';
                            if (offerNumber && fullText.startsWith(offerNumber)) {
                                fullText = fullText.substring(offerNumber.length).trim();
                            }
                            const minPurchaseMatch = fullText.match(/Min(?:imum)? purchase value (?:INR|₹) (\d+)/i);
                            const minPurchaseValue = minPurchaseMatch ? minPurchaseMatch[1] : '';
                            
                            return {
                                offerNumber,
                                fullOfferText: fullText,
                                minPurchaseValue: minPurchaseValue ? `INR ${minPurchaseValue}` : ''
                            };
                        });
                    });
                }
            }
        } catch (error:any) {
            console.log('Error extracting bank offers:', error.message);
        }
                
        bankOffers = Array.from(new Set(bankOffers.map(JSON.stringify))).map(JSON.parse);
        const productDetails = {
            title,
            rating,
            numberOfRatings,
            sellingPrice,
            totalDiscount,
            bankOffers,
            "About this item" : LiS,
            "Product Information" : techDetails,
            "High Resolution Images" : highResImageUrls,
            manufacturerImages,
            summaryReview,
        }
        return productDetails;
    } catch (error) {
        console.error(error);
    }
}