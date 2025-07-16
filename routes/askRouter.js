
import express from 'express';

import {askAI} from './askAI.js';


const router=express.Router();


router.post('/task',async(req,res)=>{

    const{prompt}=req.body;

    if(!prompt?.trim()){
        return res.status(400).json({
            error:"Prompt is required"
        })
    }

    try{
        const message=await askAI(prompt);

        res.json({result:message})
    }

    catch(err){

        console.error('Error in AI',err?.response?.data || err.message);

        res.status(500).json({error:'AI response failed'})
    }

})

export default router 
