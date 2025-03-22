import { Router } from "express";
import getProductDetails from "controller/product.controller";
const productRouter = Router();
productRouter.post("/",getProductDetails);
export default productRouter;