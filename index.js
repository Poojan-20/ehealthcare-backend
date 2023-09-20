const express = require("express");
const http = require("http");
const socket = require("socket.io");
var cors = require('cors')

const app = express();
const server = http.createServer(app);
const io = socket(server);

// const PORT = process.env.PORT || 5001;

const users = {};
const socketToRoom = {};

// app.use(cors())
// app.use(cors({credentials: true, origin: 'http://localhost:3000'}));
// app.use((req,res,next)=>{
//   res.setHeader('Access-Control-Allow-Origin','*');
//   res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,PATCH,DELETE');
//   res.setHeader('Access-Control-Allow-Methods','Content-Type','Authorization');
//   next(); 
// })
app.get("/", (req, res) => {
  res.send("Server is running");
});

//SOCKET CONFIGURATION

io.on("connection", (socket) => {
  // JOIN ROOM EVENT
  // socket.on("join room", (roomID) => {
  //   if (users[roomID]) {
  //     const length = users[roomID].length;
  //     if (length === 10) {
  //       socket.emit("room full");
  //       return;
  //     }
  //     users[roomID].push(socket.id);
  //   } else {
  //     users[roomID] = [socket.id];
  //   }
  //   socketToRoom[socket.id] = roomID;
  //   const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);

  //   socket.emit("all users", usersInThisRoom);
  //   console.log(usersInThisRoom)
  // });
  socket.on("join room", (roomID) => {
    console.log("in join room")
    if (users[roomID]) {
      const length = users[roomID].length;
      if (length === 10) {
        socket.emit("room full");
        return;
      }
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }
    socketToRoom[socket.id] = roomID;
    
    // get all sockets in the room except the current socket
    const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);
  
    // emit the all users event to all sockets in the room
    io.in(roomID).emit("all users", usersInThisRoom);
    console.log(usersInThisRoom)
  });
  
  socket.on("sending signal", (payload) => {
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });

  socket.on("returning signal", (payload) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  // DISCONNECT EVENT
  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomID] = room;
    }
    socket.broadcast.emit("user left", socket.id);
  });
});

server.listen(5003, () => console.log(`Server listening on port 5003`));
