import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from "./routes/user.routes.js"
import geminiResponse from "./gemini.js"
import path from "path"
const app=express()
app.use(cors({
    origin:"https://ai-virtual-assistant-frontend-rwvj.onrender.com",
    credentials:true
})

const __dirname = import.meta.dirname;
const port=process.env.PORT || 5000

app.set(express.static(path.join(__dirname,"../frontend/dist")));
app.use(express.json())
app.use(cookieParser())
app.use("/api/auth",authRouter)
app.use("/api/user",userRouter)
console.log(__dirname)
app.get("/home",(req,res)=>{
    res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
})
app.listen(port,()=>{
    connectDb()
    console.log("server started")
})

