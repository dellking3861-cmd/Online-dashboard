const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware: CORS allow karne ke liye (frontend se API access)
app.use(cors());

// Middleware: JSON data ko parse karne ke liye
app.use(express.json());

// products.json file ka path
const productsFile = path.join(__dirname, 'products.json');

// Helper function: products.json padh kar array return karta hai
function readProducts() {
  const data = fs.readFileSync(productsFile, 'utf8');
  return JSON.parse(data);
}

// Helper function: array ko products.json me save karta hai
function writeProducts(products) {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
}

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to Online Store API!');
});

// GET /api/products -> saare products return karta hai (200)
app.get('/api/products', (req, res) => {
  const products = readProducts();
  res.status(200).json(products);
});

// GET /api/products/:id -> ek product return karta hai, nahi mila to 404
app.get('/api/products/:id', (req, res) => {
  const products = readProducts();
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);

  if (!product) {
    return res.status(404).json({ message: 'Product nahi mila' });
  }

  res.status(200).json(product);
});

// POST /api/products -> naya product add karta hai (201)
app.post('/api/products', (req, res) => {
  const products = readProducts();
  const { name, price, stock, category } = req.body;

  // Naya id generate karo (sabse bada id + 1)
  const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

  const newProduct = {
    id: newId,
    name,
    price,
    stock,
    category
  };

  products.push(newProduct);
  writeProducts(products);

  res.status(201).json(newProduct);
});

// PUT /api/products/:id -> product update karta hai
app.put('/api/products/:id', (req, res) => {
  const products = readProducts();
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Product nahi mila' });
  }

  const { name, price, stock, category } = req.body;

  // Sirf jo fields bheji gayi hain unhe update karo
  if (name !== undefined) products[index].name = name;
  if (price !== undefined) products[index].price = price;
  if (stock !== undefined) products[index].stock = stock;
  if (category !== undefined) products[index].category = category;

  writeProducts(products);

  res.status(200).json(products[index]);
});

// DELETE /api/products/:id -> product delete karta hai
app.delete('/api/products/:id', (req, res) => {
  const products = readProducts();
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ message: 'Product nahi mila' });
  }

  const deletedProduct = products.splice(index, 1)[0];
  writeProducts(products);

  res.status(200).json({ message: 'Product delete ho gaya', deletedProduct });
});

app.listen(3000, () => {
  console.log('Server chal raha hai: http://localhost:3000');
});