const express = require("express");
const auth = require("../middleware/auth");
const Room = require("../models/Room");
const Message = require("../models/Message");
const bcrypt = require("bcryptjs");

const router = express.Router();

// ✅ GET ALL ROOMS (public + joined)
router.get("/rooms", auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { isPrivate: false }, // public rooms
        { members: req.user._id }, // joined rooms
      ],
    }).populate("creator", "username");

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ CREATE ROOM (ONLY IF NOT EXISTS)
router.post("/rooms", auth, async (req, res) => {
  try {
    const { name, isPrivate, password, memberIds } = req.body;

    // 🔥 CHECK IF ROOM ALREADY EXISTS
    let existingRoom = await Room.findOne({ name });

    if (existingRoom) {
      return res.status(200).json(existingRoom); // return existing instead of creating new
    }

    let hashedPassword = undefined;

    if (isPrivate && password) {
      hashedPassword = await bcrypt.hash(password, 12);
    }

    const room = new Room({
      name,
      isPrivate,
      password: hashedPassword,
      members: memberIds
        ? [...new Set([...memberIds, req.user._id])]
        : [req.user._id],
      creator: req.user._id,
    });

    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ JOIN ROOM
router.post("/rooms/join", auth, async (req, res) => {
  try {
    const { name } = req.body;

    const room = await Room.findOne({ name });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // ✅ FIX ObjectId comparison
    const isMember = room.members.some(
      (member) => member.toString() === req.user._id,
    );

    if (!isMember) {
      room.members.push(req.user._id);
      await room.save();
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ GET MESSAGES
router.get("/rooms/:roomId/messages", auth, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .populate("sender", "username")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
