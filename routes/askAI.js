

import {OpenAI} from "openai"
import dotenv from 'dotenv';




dotenv.config();

const openai=new OpenAI({

    apiKey:process.env.OPENAI_API_KEY
})

export async function askAI(prompt){


    const response=await openai.chat.completions.create({

        model:'gpt-4.1',
        messages:[{role:'user',content:prompt}],

        temperature:0.3
    })
    return response.choices[0].message.content;

}



