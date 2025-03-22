import express from "express"
import morgan from "morgan"
import productRouter from "routes/product";
const app = express();
app.use(express.json())
app.use(morgan("dev"))
app.use('/product',productRouter);
app.listen(3000,()=>{
    console.log('server up on port ' + 3000);
})