import {createServer} from "http";
import { readFile,writeFile } from "fs/promises";
import { basename, join } from "path";
import { cwd } from "process";
import { json } from "stream/consumers";
import { writeFile } from "fs";

const productPath = join(process,cwd(),"data/products.json");

async function getProducts() {
    try{
        const products = await readFile(productPath,"utf-8");
        return JSON.parse(products);
    }catch(error){
        console.log(`ERROR: ${error.message}`);
    }
};

async function writeProduct(data) {
    try{
        await writeFile(productPath, JSON.stringify(data,null,2));
    }catch(error){
        console.log(`Errorr on adding new product: ${error.message}`);
    };
};

const server = createServer(async (req,res)=>{
    res.setHeader("Content-Type","application/json");
    if(req.url === "/products" && req.method === "GET"){
        const products = await getProducts();
        res.writeHead(200);
        res.end(JSON.stringify(products));
    }
    if(req.url.startsWith("/products/" && req.method === "GET")){
        const id = req.url.split("/")[2];
        const products = await getProducts();
        const product = products.find(el => el.id == id);
        if(!product){
            res.setHeader(404)
            res.end(JSON.stringify({
                message: `Product not found by id ${id} `
            }));
        }
        res.setHeader(200);
        return res.end(JSON.stringify(product));
    }
    if(req.url === "/products" && req.method === "POST"){
        let body = "";
        req.on("data",(chunk) => {
            body += chunk;
        });

        req.on("end",async() =>{
            const products = await getProducts();
            const newProduct = {id: products.at(-1)?.id +1, ...JSON.parse(body)};
            products.push(newProduct);
            await writeProduct(products);
            res.setHeader(201);
            return res.end(JSON.stringify({
                message: "success"
            }));
        });
    }
    else{
        res.setHeader(404)
        res.end(JSON.stringify({
            message: "Page not found"
        }));
    }
});

server.listen(1114,() => console.log('server listening on port 1114'));