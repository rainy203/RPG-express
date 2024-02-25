import express from "express";
import http from "http";
import cors from "cors";
import { Message } from "./database.js";
import { Server } from "socket.io";
import { User } from "./database.js";
import OpenAI from "openai";
import { Convo } from "./database.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cors());
let session;
let params;
let type;

function getStat(content, item) {
  let lines = content.split("\n");
  // Find the inventory line
  let inventoryLine = lines.find((line) => line.startsWith(item));
  if (inventoryLine) {
    let inventoryItems = inventoryLine.substring(item.length).trim();

    return inventoryLine;
  }
}

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

app.get("/session", async (req, res) => {
  res.send({ message: "hi" });
});
app.post("/session", async (req, res) => {
  const hello = req.body;
  session = hello.session;
  params = hello.params;
  type = hello.type;

  res.send({ message: "Hi" });
});

io.on("connection", async (socket) => {
  if (session && params) {
    const currentUser = await User.findById(session.userId);

    const messageList = await Message.find({
      $or: [
        { $and: [{ sender: currentUser.username }, { recipient: params }] },
        { $and: [{ sender: params }, { recipient: currentUser.username }] },
      ],
    });

    socket.emit("messageList", JSON.parse(JSON.stringify(messageList)));
    const currentConvo = await Convo.findById(params);
    if (currentConvo) {
      socket.emit("stats", {
        inventory: currentConvo.iventory,
        hp: currentConvo.hp,
        xp: currentConvo.xp,
      });
    }

    socket.on("systemMessage", async (message) => {
      const currentConvo = await Convo.create({
        _id: params,
        model: "Chrono",
        content: [],
        createdBy: session.userId,
        type: type,
      });
      console.log(params);
      const newMessage = await Message.create({
        sender: currentUser.username,
        content: message.content,
        recipient: params,
        role: "system",
      });

      io.emit("initMessage", {
        content: newMessage.content,
        sender: currentUser.username,
        time: newMessage.timeSent,
        pfp: currentConvo.pfp,
      });
      currentConvo.content.push({
        role: newMessage.role,
        content: newMessage.content,
      });
      await currentConvo.save();

      const completion = await openai.chat.completions.create({
        messages: currentConvo.content,
        model: "gpt-4",
      });

      const newGPTMessage = await Message.create({
        sender: params,
        content: completion.choices[0].message.content,
        recipient: currentUser.username,
        role: completion.choices[0].message.role,
      });
      const inventory = getStat(
        completion.choices[0].message.content,
        "Inventory:"
      );
      const xp = getStat(completion.choices[0].message.content, "XP:");
      const hp = getStat(completion.choices[0].message.content, "HP:");

      io.emit("initGPTMessage", {
        content: newGPTMessage.content,
        sender: newGPTMessage.sender,
        time: newGPTMessage.timeSent,
      });

      currentConvo.content.push({
        role: newGPTMessage.role,
        content: newGPTMessage.content,
      });
      currentConvo.iventory = inventory;
      currentConvo.xp = xp;
      currentConvo.hp = hp;
      await currentConvo.save();
      io.emit("stats", {
        inventory: currentConvo.iventory,
        hp: currentConvo.hp,
        xp: currentConvo.xp,
      });
    });
    socket.on("userMessage", async (message) => {
      const currentConvo = await Convo.findOne({ _id: params });

      const newMessage = await Message.create({
        sender: currentUser.username,
        content: message.content,
        recipient: params,
        role: "user",
      });

      io.emit("initMessage", {
        content: newMessage.content,
        sender: currentUser.username,
        time: newMessage.timeSent,
      });

      currentConvo.content.push({
        role: newMessage.role,
        content: newMessage.content,
      });
      await currentConvo.save();

      const completion = await openai.chat.completions.create({
        messages: currentConvo.content,

        model: "gpt-4",
      });

      const inventory = getStat(
        completion.choices[0].message.content,
        "Inventory:"
      );
      const xp = getStat(completion.choices[0].message.content, "XP:");
      const hp = getStat(completion.choices[0].message.content, "HP:");

      const newGPTMessage = await Message.create({
        sender: params,
        content: completion.choices[0].message.content,
        recipient: currentUser.username,
        role: completion.choices[0].message.role,
      });

      io.emit("initGPTMessage", {
        content: newGPTMessage.content,
        sender: newGPTMessage.sender,
        time: newGPTMessage.timeSent,
      });

      currentConvo.content.push({
        role: newGPTMessage.role,
        content: newGPTMessage.content,
      });
      currentConvo.iventory = inventory;
      currentConvo.xp = xp;
      currentConvo.hp = hp;
      await currentConvo.save();
      io.emit("stats", {
        inventory: currentConvo.iventory,
        hp: currentConvo.hp,
        xp: currentConvo.xp,
      });
    });
  } else {
    io.emit("error", { message: "Please Sign In or Refresh the page" });
  }
});

server.listen(3000, () => {
  console.log("port 3000 online");
});
