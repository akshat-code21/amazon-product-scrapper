import type { Request, Response } from "express";
import scrapeData from "scraper/scraper";
export default async function getProductDetails(req:Request,res:Response){
    try{
        const {productLink}  = req.body;
        const productDetails = await scrapeData(productLink);
        res.json({
            success : true,
            productDetails
        })
    }catch(e){
        res.status(404).json({
            success : false
        })
    }
}