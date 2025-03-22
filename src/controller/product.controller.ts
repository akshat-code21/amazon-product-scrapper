import type { Request, Response } from "express";
import scrapeData from "scraper/scraper";
export default async function getProductDetails(req:Request,res:Response){
    const { productLink } = req.body;
    scrapeData(productLink);
    res.json({
        success : true
    })
}