import path from "path";
import fs from "fs";
import csv from "csv-parser";

export class Product {
  selected?: boolean;

  constructor(
    public productNo: number,
    public productName: string,
    public productPrice: number,
    public productDescription: string,
  ) {}
}

export const readProductsCSV = async (filePath: string): Promise<Product[]> => {
  return new Promise((resolve, reject) => {
    const products: Product[] = [];
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      return reject(new Error(`CSV file is not found: ${filePath}`));
    }

    fs.createReadStream(absolutePath)
      .pipe(csv())
      .on("data", (row: { productNo: string; productName: string; productPrice: string; productDescription: string }) => {
        const productNo = parseInt(row.productNo);
        const productName = row.productName;
        const productPrice = parseFloat(row.productPrice);
        const productDescription = row.productDescription;

        products.push(
          new Product(productNo, productName, productPrice, productDescription)
        );
      })
      .on("end", () => {
        resolve(products);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

export const getProducts = async (filePath: string): Promise<Product[]> => {
  const products = await readProductsCSV(filePath);
  if (products.length === 0) {
    throw new Error(`No products found in ${filePath}`);
  }
  return products;
};
