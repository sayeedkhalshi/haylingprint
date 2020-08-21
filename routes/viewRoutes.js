const express = require('express');
const router = express.Router();
const localstorage = require('node-localstorage');
const Category = require('./../models/categoryModel');
const Product = require('./../models/productModel');
const Home = require('./../models/homePageModel');
const authController = require('./../controllers/authController');
const adminController = require('./../controllers/adminController');
const APIFeatures = require('./../utils/apiFeatures');
const productController = require('./../controllers/productController');
const Cart = require('./../models/cartModel');
const User = require('./../models/userModel');
const { route } = require('./userRoutes');

router.use(authController.isLoggedIn);

const categoriesFunction = async (req, res, next) => {
  categories = await Category.find();

  topCategories = await Category.find({ parentCategory: { $exists: false } });
  // topCategories.forEach(category, ()=> {
  //   if (!category.parentCategory) {

  //   }
  // })
  next();
};
router.use(categoriesFunction);
router.get('/', async (req, res) => {
  const homeLinks = await Home.find();

  // User.findOneAndUpdate(
  //   { email: 'sayeedmondal1412@gmail.com' },
  //   { role: 'admin', emailVerified: true }
  // );
  const products = await Product.find();
  res.render('home', { homeLinks, products });
});

router.get('/register', (req, res) => {
  res.render('auth/register');
});

router.get('/login', (req, res) => {
  res.render('auth/login');
});

router.get('/cart', async (req, res) => {
  //catch localstorage
  res.render('cart');
});
router.get('/about', (req, res) => {
  res.render('about');
});

router.get('/account', authController.protect, (req, res) => {
  res.render('user/account');
});

//product get all
router.get('/products/', async (req, res) => {
  let filter = {};
  if (req.params.productId) filter = { tour: req.params.productId };

  const features = new APIFeatures(Product.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  // const doc = await features.query.explain();
  const doc = await features.query;

  res.render('products', { doc });
});
router.get('/products/:id', async (req, res) => {
  const id = req.params.id;
  const product = await Product.findById(id);
  res.render('singleProduct', { product });
});
//product
router.get('/categories/:id', async (req, res) => {
  const id = req.params.id;
  const category = await Category.findById(id);

  if (category) {
    const products = await Product.find({ category: category.id });
    return res.render('singleCategory', { category, products });
  }
  if (!category) {
    const category = { name: 'Not found' };
    return res.render('singleCategory', { category });
  }
});

//admin only
//for admin only

router.use(authController.protect, authController.restrictTo('admin'));

//dashboard
router.get('/admin', async (req, res) => {
  res.render('admin/dashboard', { layout: 'layoutAdmin' });
});

router.get('/admin/products', async (req, res) => {
  let filter = {};
  if (req.params.productId) filter = { tour: req.params.productId };

  const features = new APIFeatures(Product.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  // const doc = await features.query.explain();
  const doc = await features.query;
  res.render('admin/products', { layout: 'layoutAdmin', doc });
});

router.get('/admin/products/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);

  res.render('admin/singleProduct', { product, layout: 'layoutAdmin' });
});

router.post(
  '/admin/products/:id',
  productController.uploadProductImages,
  productController.resizeProductImages,
  productController.updateProduct
);
router.get('/admin/add-product', async (req, res) => {
  //const categories = await Category.find();
  res.render('addProduct', { layout: 'layoutAdmin' });
});

router.post('/admin/products/delete/:id', productController.deleteProduct);

//variants

router.get('/admin/add-variants', (req, res) => {
  res.render('admin/addVariant', { layout: 'layoutAdmin' });
});

router.post('/admin/add-variants', async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { SKU: req.body.product },
    {
      $push: {
        variants: {
          base: req.body.base,
          name: req.body.name,
          value: req.body.value,
          SKU: req.body.SKU,
          stock: req.body.stock,
          price: req.body.price,
        },
      },
    }
  );
  if (product) {
    return res.redirect(`/admin/products/${product.id}`);
  }
});

router.get('/admin/add-category', async (req, res) => {
  //const categories = await Category.find();
  res.render('addCategory', { layout: 'layoutAdmin' });
});
router.get('/admin/categories', async (req, res) => {
  //const categories = await Category.find();
  res.render('admin/categories', { layout: 'layoutAdmin' });
});

router.get('/admin/home', async (req, res) => {
  const homes = await Home.find();
  const url = `${req.protocol}://${req.get('host')}`;
  res.render('admin/adminHome', { layout: 'layoutAdmin', homes, url });
});

router.post('/admin/home', async (req, res) => {
  const url = `${req.protocol}://${req.get('host')}/products/`;
  const getlink = req.body.link;
  const link = getlink.toString().replace(url, '');

  const product = await Product.findById({ _id: link });

  if (product) {
    //write error message here
    const homes = await Home.find();
    const url = `${req.protocol}://${req.get('host')}`;
    return res.render('admin/adminHome', { layout: 'layoutAdmin', homes, url });
  }

  const newLink = await Home.create({ link });

  res.redirect('/admin/home');
});

router.get('/admin/home/:id', async (req, res) => {
  const home = await Home.findById(req.params.id);
  res.render('admin/singleHomeLink', { layout: 'layoutAdmin', home });
});

router.post('/admin/home/delete/:id', async (req, res) => {
  const id = req.params.id;
  const doc = await Home.findByIdAndDelete(id);

  res.redirect('/admin/home');
});

module.exports = router;
