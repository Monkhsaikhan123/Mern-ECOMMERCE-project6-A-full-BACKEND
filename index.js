const express = require ('express');
const app = express();
const mongoose = require('mongoose')

app.use(express.json())
const cors = require('cors')
app.use(cors())
const bcrypt = require('bcryptjs')
app.set("view engine", "ejs");
app.use(express.urlencoded({extended:false}))
var nodemailer = require('nodemailer');

const jwt = require('jsonwebtoken');
const JWT_SECRET= "hagakljkglahgahgla[]lkjfk34dadw3523ghdgz";


mongoose.connect("mongodb+srv://DbUser:DbUser@munkh.tgu5wgq.mongodb.net/Login",{

}).then(()=>{console.log("connected Database")})
.catch((e)=>console.log(e))
const { ObjectId } = require('mongodb');

require('./schema')
const User = mongoose.model('users');

app.post('/register', async(req,res)=>{
    const {fname, lname, email,password,Usertype} = req.body;

    const encryptedPassword = await bcrypt.hash(password, 10)
    try{
        const oldUser =await User.findOne({email})
        if(oldUser){
           return res.send({error: " User Exist"})
        }
        await User.create({
            fname,
            lname,
            email,
            password:encryptedPassword,
            Usertype
        })
        res.send({status : 'ok'})
    }catch{
        res.send({status: 'error'})
    }
})


app.post('/login-user', async(req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({email})
    if(!user){
        return res.json({error : "User not Found"});
    }
    if(await bcrypt.compare(password, user.password)){
        const token = jwt.sign({email: user.email}, JWT_SECRET, {
            expiresIn:'1000m'
        });
        
        if(res.status(201)){
            return res.json({status: 'ok', data:token})
        }else{
            return res.json({error: 'error'});
        }
    }
    res.json({status:'error', error:'invalid password'})
})

app.post('/userData', async(req,res)=>{
    const {token}= req.body;
    try {
        const user=jwt.verify(token,JWT_SECRET,(err,res)=>{
            if(err){
                return 'token expired';
            }
           return res;
        });
        console.log(user);
        if(user==='token expired'){
            return res.send({status:'error', data:'token expired'})
        }
        
        const useremail = user.email;
        console.log(user)
        User.findOne({email:useremail})
        .then((data)=>{
            res.send({status:'ok', data:data})
        }).catch((error)=>{
            res.send({status:'error', data:error})
        })

    } catch (error) {
        
    }
})
app.post('/forgot-password', async(req,res)=>{
    const{email}= req.body
    try {
        const oldUser = await User.findOne({email});
        if(!oldUser){
            return res.json({status:"user not exists!"})
        }
        const secret = JWT_SECRET + oldUser.password;
        const token = jwt.sign({email:oldUser.email, id:oldUser._id}, secret, {expiresIn:'5m'})
        const link = `http://localhost:3000/reset-password/${oldUser._id}/${token}`;
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: 'monkhsaikhan01@gmail.com',
              pass: 'ymsp jsnp srdv bugm'
            }
          });
          
          var mailOptions = {
            from: 'youremail@gmail.com',
            to: email,
            subject: 'Password Reset',
            text: link
          };
          
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        console.log(link);
    } catch (error) {
        
    }
})
app.get('/reset-password/:id/:token', async(req,res)=>{
    const {id,token} = req.params;
    console.log(req.params)
    const oldUser = await User.findOne({_id : id});
    if(!oldUser){
        return res.json({status:"User not exists!!"})
    }
    const secret = JWT_SECRET + oldUser.password;
    try{
        const verify=jwt.verify(token,secret)
        res.render("index",{email:verify.email, status:'Not verified'})
    }catch(error){
        console.log(error);
        res.send("Not verified");
    }
})

app.post('/reset-password/:id/:token', async(req,res)=>{
    const {id,token} = req.params;
    const{password}=req.body;
    const oldUser = await User.findOne({_id : id});
    if(!oldUser){
        return res.json({status:"User not exists!!"})
    }
    const secret = JWT_SECRET + oldUser.password;
    try{
        const verify=jwt.verify(token,secret)
        const encryptedPassword = await bcrypt.hash(password,100000);
        await User.updateOne(
        {
            _id:id,
        },
        {
            $set:{
                password:encryptedPassword,
            }
        }
        )
        res.render('index', {email:verify.email,status:'verified'})



    }catch(error){
        console.log(error);
        res.json({status:"Something wend wrong"});
    }
})

app.get('/getUser', async(req,res)=>{
    const data = await User.find({})
   res.json({success: true, data:data})
})

app.post('/updateUser', async(req,res)=>{
    const{id, fname, lname,image} = req.body
    try {
        await User.updateOne({_id:id},{
            $set:{
                fname:fname,
                lname:lname,
                image:image
            }
        })
        return res.json({status:"ok", data: "updated"})
    } catch (error) {
        return res.json({status : "error", data:error})
    }
})


app.post('/deleteUser', async(req,res)=>{
    const {userid} = req.body;
    try {
        User.deleteOne({_id:userid}, function(err,res){
            console.log(err)
        })
        res.send({status:"ok" ,data:"deleted"})
    } catch (error) {
        console.log(error)
    }
})

app.delete('/deleteUser/:id' , async(req,res)=>{
    const id = req.params.id;
    console.log(id)
    const data = await User.deleteOne({_id: id})
    res.send({success:true, message: "User has Deleted", data:data})
})


app.patch('/users//admin/:id', async(req,res)=>{
    const userId = req.params.id
    const {name, email, photoURL, userType} = req.body;
    try {
        const updatedUser = await User.findByIdAndUpdate(userId,
            {userType:'admin'},
            {new:true, runValidators:true}
        );

        if(!updatedUser){
            return res.status(404).json({message: "User not found"});
        }
        res.status(200).json(updatedUser)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
})
////////////////////////////////////MENU ITEMS //////////////////////////////////
require('./schema')
const Products = mongoose.model('products');

//get all items from menu
app.get('/menu', async(req, res) => {
    const result = await Products.find().sort({createdAt:-1})
    res.send(result)
})

//upload menu item to menu
app.post('/menu', async(req,res)=>{
    const newItem = req.body;
    try {
        const result = await Products.create(newItem);
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
})

//get single item from menu
app.get('/menu/:id', async(req, res) => {
    const result = await Products.findById(req.params.id);
    res.send(result)
})

//delete single item from menu
app.delete('/menu/:id', async(req,res)=>{
    const id = req.params.id;
    console.log(id)
    const data = await Products.deleteOne({_id: id})
    res.send({success:true, message: "Product has Deleted", data:data})
})
app.patch('/menu/:id', async(req,res)=>{
    const menuId = req.params.id;
    const {name, description, price, image, quantity, category} = req.body;
    try {
        const updateMenu = await Products.findByIdAndUpdate(menuId, {name, description, quantity, price, image, category},
            {new:true, runValidators:true} )
        if(!updateMenu){
            return res.status(404).json({message:"Blog not found"})
        }
        res.status(201).json(updateMenu)
    } catch (error) {
        res.status(500).json({message:error.message})
    }
})





/////////////////////////////////////MENU2////////////////////////////////
require('./schema')
const Products2 = mongoose.model('products2');


//get menu2
app.get('/menu2', async(req, res) => {
    const result = await Products2.find().sort({createdAt:-1})
    res.send(result)
})
app.post('/menu2', async(req,res)=>{
    const newItem = req.body;
    try {
        const result = await Products2.create(newItem);
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
})

//get single item from menu2
app.get('/menu2/:id', async(req, res) => {
    const result = await Products2.findById(req.params.id);
    res.send(result)
})

//delete single item from menu2
app.delete('/menu2/:id', async(req,res)=>{
    const id = req.params.id;
    console.log(id)
    const data = await Products2.deleteOne({_id: id})
    res.send({success:true, message: "Item has Deleted", data:data})
})

app.patch('/menu2/:id', async(req,res)=>{
    const menuId = req.params.id;
    const {name, description, price, image, quantity, category} = req.body;
    try {
        const updateMenu = await Products2.findByIdAndUpdate(menuId, {name, description, quantity, price, image, category},
            {new:true, runValidators:true} )
        if(!updateMenu){
            return res.status(404).json({message:"Blog not found"})
        }
        res.status(201).json(updateMenu)
    } catch (error) {
        res.status(500).json({message:error.message})
    }
})






/////////////////////////////////////CART////////////////////////////////
require('./schema')
const Cart = mongoose.model('cart');

app.post('/carts', async(req,res)=>{
    const {menuItemId, name, recipe, image, price, quantity, email} = req.body;
    try {
       //existing menu item
 /*     const existingCartItem = await Cart.findOne({menuItemId})
       if(existingCartItem){
            return res.status(400).json({message:"Product already inside your cart"})
       } */
       
       const cartItem = await Cart.create({menuItemId, name, recipe, image, price, quantity, email})
       res.status(201).json({message:"Сагсанд нэмэгдлээ"})
    } catch (error) {
        res.status(500).json({message:error.message});
    }
})

app.get('/carts' ,async(req,res)=>{
    try {
        const email = req.query.email
        console.log(email)
        const query = {email:email}
        const result = await Cart.find(query).exec()
        res.status(201).json(result)
    } catch (error) {
        res.status(500).json({message:error.message});
    }
})
//get carts
app.get('/getallcarts', async(req, res) => {
    const result = await Cart.find();
    res.send(result)
})
///get single cart

app.get('/carts/:id', async(req,res)=>{
    const cartId = req.params.id;
    try {
        const cartItem = await Cart.findById(cartId)
        res.status(201).json(cartItem)
    } catch (error) {
        res.status(500).json({message:error.message});
    }
})
//delete cart
app.delete('/carts/:id', async(req,res)=>{
    const cartId = req.params.id;
    try {
        const deletedCart = await Cart.findByIdAndDelete(cartId)
        if(!deletedCart){
            return res.status(401).json({message:"Cart item not found"})
        }
        res.status(201).json({message:"Cart Item successfully deleted"})
    } catch (error) {
        res.status(500).json({message:error.message});
    }
})
//update cart quantity
app.put('/carts/:id', async(req,res)=>{
    const cartId = req.params.id;
    const {menuItemId, name, recipe, image, price, quantity, email} = req.body;
    try {
        const updatedCart = await Cart.findByIdAndUpdate(
            cartId, {menuItemId, name, price, recipe, image, quantity, email},{
                new:true, runValidators:true
            }
        )
        if(!updatedCart){
            return res.status(404).json({message:"Cart item not found"})
        }
        res.status(201).json(updatedCart)
    } catch (error) {
        res.status(500).json({message:error.message});
    }
})



require('./schema')
const Blog = mongoose.model('blog');

app.get('/blog', async(req,res)=>{
    let r = await Blog.find({}).sort({createdAt:-1})
    console.log(r)
    res.send(r);
})


app.post('/blog', async(req,res)=>{
    const newBlog = req.body;
    try {
        const result = await Blog.create(newBlog);
        res.status(201).json(result)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
})
app.get('/blogs' ,async(req,res)=>{
    try {
        const email = req.query.email
        console.log(email)
        const query = {email:email}
        const result = await Blog.find(query).exec()
        res.status(201).json(result)
    } catch (error) {
        res.status(500).json({message:error.message});
    }
})

app.get('/blog/:id', async(req,res)=>{
    const blogId = req.params.id;
    try {
        const blogItem = await Blog.findById(blogId)
        res.status(201).json(blogItem)
    } catch (error) {
        res.status(500).json({message:error.message});
    }
})

app.delete('/blog/:id', async(req,res)=>{
    const id = req.params.id;
    console.log(id)
    const data = await Blog.deleteOne({_id: id})
    res.send({success:true, message: "Blog has Deleted", data:data})
})


app.patch('/blog/:id', async(req,res)=>{
    const menuId = req.params.id;
    const {name, description, price, image, category} = req.body;
    try {
        const updateMenu = await Blog.findByIdAndUpdate(menuId, {name, description, price, image, category},
            {new:true, runValidators:true} )
        if(!updateMenu){
            return res.status(404).json({message:"Blog not found"})
        }
        res.status(201).json(updateMenu)
    } catch (error) {
        res.status(500).json({message:error.message})
    }
})



require('./schema')
const Like = mongoose.model('like');


app.get('/like/:id', async(req,res)=>{
    const cartId = req.params.id;
    try {
        const cartItem = await Like.findById(cartId)
        res.status(201).json(cartItem)
    } catch (error) {
        res.status(500).json({message:error.message});
    }
})

app.get('/like' ,async(req,res)=>{
    try {
        const email = req.query.email
        console.log(email)
        const query = {email:email}
        const result = await Like.find(query).exec()
        res.status(201).json(result)
    } catch (error) {
        res.status(500).json({message:error.message});
    }
})
app.post('/like', async(req,res)=>{
    const {menuItemId, name, recipe, image, price, quantity, email} = req.body;
    try {
       //existing menu item
 /*     const existingCartItem = await Cart.findOne({menuItemId})
       if(existingCartItem){
            return res.status(400).json({message:"Product already inside your cart"})
       } */
       
       const cartItem = await Like.create({menuItemId, name, recipe, image, price, quantity, email})
       res.status(201).json({message:"Like darlaa"})
    } catch (error) {
        res.status(500).json({message:error.message});
    }
})
app.listen(3000,()=>{
    console.log("server started")
});