require('dotenv').config();
const express=require('express');
const app=express();
const bodyParser=require('body-parser');
const mongoose=require('mongoose');
const _=require('lodash');
const session=require("express-session");
const flash=require("express-flash");
const MongoDbStore=require("connect-mongo")(session);
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(express.json());



mongoose.connect(process.env.DB_URL,{useNewUrlParser:true,useUnifiedTopology:true});
mongoose.set("useCreateIndex",true);
const connection=mongoose.connection;
let mongoStore=new MongoDbStore({
  mongooseConnection: connection,
  collection: 'sessions'
});

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  store:mongoStore,
  saveUninitialized: false,
  cookie: {maxAge: 1000*60*60*24} //24hrs
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use((req,res,next)=>{
  res.locals.session=req.session;
  next();
});




const userSchema=new mongoose.Schema({
  name: String,
  username: String,
  password: String,
  admin: Boolean
});
userSchema.plugin(passportLocalMongoose);
const User=new mongoose.model("User",userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


const productSchema=new mongoose.Schema({
  title:String,
  body: String,
  category: String,
  author: String,
  price: String,
  weight: String,
  paperback: String,
  isbn10: String,
  isbn13: String,
  dimensions: String,
  publisher: String,
  language: String
});
const Product=new mongoose.model("Product",productSchema);

const categorySchema=new mongoose.Schema({
  title: String
});
const Category=new mongoose.model("Category",categorySchema);


app.get("/",async function(req,res){
  await Product.find().exec(function(err,foundProducts){
    if(err){
      console.log(err);
      res.redirect("/");
    }
    else{
      res.render("home",{products:foundProducts});
    }
  });
});


app.get("/admin",function(req,res){
  res.render("admin");
});


app.get("/cart",function(req,res){
  res.render("cart");
});

app.post("/update-cart",function(req,res){
  if(!req.session.cart){
    req.session.cart={
      items:{},
      totalQty:0,
      totalPrice:0
    }
  }
  let cart=req.session.cart;
  if(!cart.items[req.body._id]){
    cart.items[req.body._id]={
      item:req.body,
      qty:1
    }
    cart.totalQty=cart.totalQty+1;
    cart.totalPrice=cart.totalPrice+req.body.price;
  }
  else{
    cart.items[req.body._id].qty=cart.items[req.body._id].qty+1;
    cart.totalPrice=cart.totalPrice+req.body.price;
    cart.totalQty=cart.totalQty+1;
  }
  return res.json({totalQty:req.session.cart.totalQty});

});


app.get("/compose",async function(req,res){
  if(req.isAuthenticated() && req.user.admin===true){
    await Category.find().exec(function(err,foundCategories){
      if(err){
        console.log(err);
        res.redirect("/compose");
      }
      else{
        res.render("compose",{categories:foundCategories});
      }
    });
  }
  else{
    res.redirect("/login");
  }
});



app.post("/compose",function(req,res){
  if(req.isAuthenticated() && req.user.admin===true){
    product=new Product({
      title: req.body.title,
      body: req.body.body,
      category: req.body.category,
      author: req.body.author,
      price: req.body.price,
      weight: req.body.weight,
      paperback: req.body.paperback,
      isbn10: req.body.isbn10,
      isbn13: req.body.isbn13,
      dimensions: req.body.dimensions,
      publisher: req.body.publisher,
      language: req.body.language
    });
    product.save();
    res.redirect("/compose");
  }
  else{
    res.redirect("/login");
  }
});


app.get("/orders",function(req,res){
  res.render("orders");
});



app.get("/product/:pid",async function(req,res){
  const productId=req.params.pid;
  await Product.findOne({_id:productId},function(err,foundProduct){
    if(err){
      console.log(err);
      res.redirect("/");
    }
    else{
      res.render("product",{product:foundProduct});
    }
  });
});



app.get("/profile/:pname",async function(req,res){
  const authorName=req.params.pname;
  await Product.find({author:authorName},function(err,foundProducts){
    if(err){
      console.log(err);
      res.redirect("/");
    }
    else{
      res.render("profile",{products:foundProducts});
    }
  });
});


app.get("/categories/:cname",async function(req,res){
  const categoryName=req.params.cname;
  await Product.find({category:categoryName},function(err,foundProducts){
    if(err){
      console.log(err);
      res.redirect("/");
    }
    else{
      res.render("home",{products:foundProducts});
    }
  });
});


app.get("/login",function(req,res){
  res.render("login");
});

app.post("/login",function(req,res){
  const user=new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user,async function(err){
    if(err){
      console.log(err);
      res.redirect("/login");
    }else{
      await passport.authenticate("local")(req,res,function(){
        res.redirect("/");
      });
    }
  })
});

app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});


app.get("/register",function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){
  User.register({username:req.body.username,name:req.body.name,admin:false},req.body.password, async function(err,user){
    if(err){
      res.send(err.message + " go back and use different email as username.");
      res.redirect("/register");
    }
    else{
      await passport.authenticate("local")(req,res,function(){
        res.redirect("/");
      });
    }
  });
});


const PORT=process.env.PORT || 3000;
app.listen(PORT,function(){
  console.log('Server is running on port '+PORT);
});