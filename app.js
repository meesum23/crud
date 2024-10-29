const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const port = 4000;
const app = express();
const key = "HERC123445hcbgbik";
app.use(express.json());

// Connect to MongoDB
async function connection() {
  try {
    await mongoose.connect("mongodb://localhost/MyDB", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connection successful");
  } catch (error) {
    console.log("Error Connecting", error);
  }
}

connection();

// Define User Schema
const Schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Create User Model
const User = mongoose.model("User", Schema);

// Endpoint Signup Code
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    await User.create({
      name,
      email,
      password,
    });

    res.status(200).json({
      msg: "Data Saved",
    });
  } catch (err) {
    res.status(402).json({
      msg: err.msg,
    });
  }
});

// Endpoint Login Code
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(404).json({
        error: "Invalid email and password",
      });
    }

    const token = jwt.sign({ _id: user._id, email: user.email }, key);
    res.status(200).json({
      msg: "Log in Successfully",
      token,
    });
  } catch (err) {
    res.status(500).json({
      msg: "Login Failed ",
    });
  }
});

// Middleware to Authenticate Token
function auth_token(req, res, next) {
  let token = req.headers.token;

  if (!token) {
    return res.status(404).json({
      msg: "Token Not Found",
    });
  }

  try {
    const decoded = jwt.verify(token, key);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({
      msg: "Invalid Token",
    });
  }
}

// Check if Logged In
app.get("/isLoggedIn", auth_token, (req, res) => {
  return res.status(200).json({
    msg: "authenticated",
    user: req.user,
  });
});

// Update User
app.put("/update", auth_token, async (req, res) => {
  const userId = req.user._id;
  const { name , email , password} = req.body;

  try {
    const updateUser = await User.findByIdAndUpdate(userId, { name  , email , password}, { new: true });
    res.status(200).json({
      msg: "updated successfully",
      user: updateUser,
    });
  } catch (error) {
    res.status(401).json({
      msg: "User not updated",
    });
  }
});

// Delete User
app.delete("/delete", auth_token, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ msg: "User deleted" });
  } catch (error) {
    res.status(400).json({ error: "Error deleting user" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});