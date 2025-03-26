import * as puppeteer from "puppeteer";

interface ProductDetails {
    title: string;
    rating: string;
    numberOfRatings: string;
    sellingPrice: string;
    totalDiscount: string;
    bankOffers: BankOffer[];
    "About this item": string[];
    "Product Information": Record<string, string>;
    "High Resolution Images": string[];
    manufacturerImages: string[];
    summaryReview: string;
}

interface BankOffer {
    offerNumber: string;
    fullOfferText: string;
    minPurchaseValue: string;
}

const SELECTORS = {
    title: "h1#title",
    rating: "i.a-icon.a-icon-star.a-star-4.cm-cr-review-stars-spacing-big",
    ratingParent: "div#averageCustomerReviews",
    sellingPrice: "span.a-price-whole",
    totalDiscount: "span.savingsPercentage",
    features: "#feature-bullets > ul",
    techSpecs: "#productDetails_techSpec_section_1",
    thumbnails: "#altImages .item",
    manufacturerImages: "#aplus img, .apm-flex img, .apm-flex-item-third-width img, .apm-text-center img, .a-spacing-mini img",
    summary: "#product-summary > p.a-spacing-small > span",
    bankOffersButton: ".a-size-base.a-spacing-micro.offers-items-title",
    allOffersLink: "#itembox-InstantBankDiscount > span > a"
} as const;

function cleanText(text: string | undefined | null): string {
    if (!text) return '';   
    return text.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '').trim();
}

async function extractBankOffers(page: puppeteer.Page): Promise<BankOffer[]> {
    try {
        const bankOffersExists = await page.$(SELECTORS.bankOffersButton);
        if (!bankOffersExists) return [];

        const allOffersLink = await page.$(SELECTORS.allOffersLink);
        if (!allOffersLink) return [];

        await allOffersLink.click();
        await page.waitForSelector('.vsx-offers-desktop-lv__list', { timeout: 5000 });

        const offers = await page.$$eval('.vsx-offers-desktop-lv__item', (offerItems) => {
            return offerItems.map(item => {
                const offerNumberElement = item.querySelector('.a-text-bold');
                const offerNumber = offerNumberElement?.textContent?.trim() || '';
                let fullText = item.textContent?.trim().replace(/\s+/g, ' ') || '';
                
                if (offerNumber && fullText.startsWith(offerNumber)) {
                    fullText = fullText.substring(offerNumber.length).trim();
                }
                
                const minPurchaseMatch = fullText.match(/Min(?:imum)? purchase value (?:INR|₹) (\d+)/i);
                const minPurchaseValue = minPurchaseMatch ? `INR ${minPurchaseMatch[1]}` : '';
                
                return { offerNumber, fullOfferText: fullText, minPurchaseValue };
            });
        });

        const uniqueOffers = [...new Map(offers.map(offer => 
            [JSON.stringify(offer), offer]
        )).values()];

        return uniqueOffers;
    } catch (error) {
        console.log('Error extracting bank offers:', error instanceof Error ? error.message : 'Unknown error');
        return [];
    }
}

export default async function scrapeData(productLink: string): Promise<ProductDetails | null> {
    let browser: puppeteer.Browser | null = null;
    
    try {
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        await page.setViewport({ width: 1080, height: 1024 });
        await page.goto(productLink);

        await Promise.all(
            Object.values(SELECTORS).map(selector => 
                page.waitForSelector(selector).catch(() => console.log(`Selector not found: ${selector}`))
            )
        );

        const title = cleanText(await page.$eval(SELECTORS.title, el => el.textContent));
        const rating = cleanText(await page.$eval(SELECTORS.rating, el => (el.previousElementSibling as any).textContent));
        const numberOfRatings = await page.$eval(SELECTORS.ratingParent, el => el.children[2].textContent?.trim());
        const sellingPrice = cleanText(await page.$eval(SELECTORS.sellingPrice, el => el.textContent));
        const totalDiscount = cleanText(await page.$eval(SELECTORS.totalDiscount, el => el.textContent));

        const features = await page.$eval(SELECTORS.features, element => {
            return Array.from(element.querySelectorAll('li'))
                .map((li: any) => li.textContent?.trim() ?? '')
                .filter(text => text !== '');
        });

        const techDetails = await page.$eval(SELECTORS.techSpecs, (element) => {
            const rows = element.querySelectorAll('tr');
            const specs: Record<string, string> = {};
            
            rows.forEach((row:any) => {
                const [label, value] = Array.from(row.children).map((cell:any) => 
                    cell.textContent.trim().replace(/\s+/g, ' ')
                );
                
                if (label && value) {
                    const cleanLabel = label.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
                    const cleanValue = value.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
                    specs[cleanLabel] = cleanValue;
                }
            });
            
            return specs;
        });
        const thumbnailUrls = await page.$$eval(SELECTORS.thumbnails, (thumbnails) => {
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

        const summaryReview = cleanText(await page.$eval(SELECTORS.summary,(element)=>element.textContent.trim()));
        const manufacturerImages = await page.$$eval(SELECTORS.manufacturerImages, (images) => {
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

        const productDetails: ProductDetails = {
            title,
            rating,
            numberOfRatings,
            sellingPrice,
            totalDiscount,
            bankOffers: await extractBankOffers(page),
            "About this item": features,
            "Product Information": techDetails,
            "High Resolution Images": highResImageUrls,
            manufacturerImages,
            summaryReview,
        };

        return productDetails;
    } catch (error) {
        console.error('Scraping failed:', error instanceof Error ? error.message : 'Unknown error');
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}