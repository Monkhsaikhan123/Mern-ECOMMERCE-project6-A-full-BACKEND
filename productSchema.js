import mongoose , {Schema} from 'mongoose';


const ProductsSchema = new mongoose.Schema(
    {   
        userId: {type:Schema.Types.ObjectId, ref:"users"},
        name:String,
        desc:String,
        price:String,
        imageURL:String,
        category:String,
        image:String, 

    },{
        timestamps:true,
        collection:'products'
    }
);

mongoose.model('products' , ProductsSchema)
