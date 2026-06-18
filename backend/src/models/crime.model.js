import mongoose from 'mongoose'

//create schema
const crimeSchema = new mongoose.Schema({
    location :{
        type:{
            latitude:{type:Number,required:true},
            longitude:{type:Number,required:true}
        },
        required:true
    },
    timeOfCrime:{
        type:Date,
        required:true
    },
    typeOfReporter:{
        type:String,
        enum:['victim','spectator'],
        required:true
    },
    reporter:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    typeOfCrime:{
     type:String,
     enum:['theft','vandalism','violence','custom'],
     required:true
    },
    severity:{
        type:String,
        enum:['low','medium','high','critical'],
    },
    customCrimeDescription:{
        type:String,
        required:function(){return this.typeOfCrime === 'custom';}
    },
    proof:{
        type:[String],

    }
},{timestamps:true})
//create model
const crimeModel = mongoose.model('crime',crimeSchema)
//export model
export default crimeModel;