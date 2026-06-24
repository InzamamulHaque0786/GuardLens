import mongoose from 'mongoose'

//create schema
const crimeSchema = new mongoose.Schema({
    crimeType:{
         type:String,
         enum:["assault","harassment","kidnapping","accident","fire","robbery","theft","suspicious","vandalism","others"],
         required:true,
    },
    crimeDescription:{
        type:String,
        required:true
    },
    crimeLocation :{
        latitude:{type:Number,required:true},
        longitude:{type:Number,required:true},
    },
    crimeTime:{
        type:Date,
        required:true
    },
    reporterType:{
        type:String,
        enum:['victim','spectator'],
        required:true
    },
    reporter:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    images:{
        type:[String],
        default: []
    },
    video:{
        type:String,
        default:''
    },
    status:{
        type:String,
        enum:['pending_review', 'verified', 'spam', 'resolved'],
        default:"pending_review"
    },
    severity:{
        type:String,
        enum:['unassigned', 'low', 'medium', 'high', 'critical'],
        default:'unassigned'
    }
},{timestamps:true})
//create model
const crimeModel = mongoose.model('crime',crimeSchema)
//export model
export default crimeModel;