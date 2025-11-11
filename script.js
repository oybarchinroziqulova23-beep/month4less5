import {createServer} from "http";
import { readFile } from "fs/promises";
import { join } from "path";
import { cwd } from "process";
import { writeFile } from "fs/promises";
import { get } from "https";

const productPath = join(process.cwd(),"data/products.json");

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

    //Barcha maxsulotlarni chiqardi
    if(req.url === "/products" && req.method === "GET"){
        const products = await getProducts();
        res.writeHead(200);
        return res.end(JSON.stringify(products));
    }

    //id orqali bitta maxsulotni topib qaytaradi
    if(req.url.startsWith("/products/") && req.method === "GET"){
        const id = req.url.split("/")[2];
        const products = await getProducts();
        const product = products.find(el => el.id == id);
        if(!product){
            res.writeHead(404)
            res.end(JSON.stringify({
                message: `Product not found by id ${id} `
            }));
        }
        res.writeHead(200);
        return res.end(JSON.stringify(product));
    }


    //yangi maxsulot qo'shadi
    if (req.url === "/products" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", async () => {
            try {
                const products = await getProducts();
                const newData = JSON.parse(body);
                const lastId = products.length ? products.at(-1).id : 0;
                const newProduct = { id: lastId + 1, ...newData };

                products.push(newProduct);
                await writeProduct(products);

                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Product added successfully" }));
            } catch (error) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Invalid JSON format" }));
            }
        });
        return;
    }

    
    //update qismi
    if (req.url.startsWith("/products/") && req.method === "PUT") {
        const id = req.url.split("/")[2];
        const products = await getProducts();
        const index = products.findIndex(el => el.id == id); 

        if (index === -1) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: `Product not found by id ${id}` }));
            return;
        }

        let body = "";
        req.on("data", chunk => {
            body += chunk;
        });

        req.on("end", async () => {
            try {
                const newData = JSON.parse(body);
                products[index] = { ...products[index], ...newData };
                await writeProduct(products);

                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Product information updated successfully" }));
            }catch (error) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Invalid JSON format" }));
            }
        });
        return
    }


    // id orqali maxsulotni ochiradi
    if(req.url.startsWith('/products/') && req.method === 'DELETE'){
        const id = req.url.split('/')[2];
        let products = await getProducts();
        const product = products.find(el => el.id == id);
        if(!product){
            res.writeHead(404);
            res.end(JSON.stringify({
                message: "Product not found "
            }))
        }
        products = products.filter(el => el.id != id);
        res.writeHead(200);
        await writeProduct(products);
        return res.end(JSON.stringify({
            message: "product is deleted"
        }))
    }

    // url hato kiritilganda ishlaydi
    else{
        res.writeHead(404)
        return res.end(JSON.stringify({
            message: "Page not found"
        }));
    }
});

server.listen(1114,() => console.log('server listening on port 1114'));